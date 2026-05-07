import argparse
from pathlib import Path
from typing import Iterable

import trimesh


def convert(svg_file: Path, stl_file: Path, height: float) -> None:
    path2d = trimesh.load_path(str(svg_file))
    if len(path2d.entities) == 0:
        raise ValueError(f"No drawable paths found in {svg_file}")

    meshes = path2d.extrude(height=height)
    if not meshes:
        raise ValueError(f"Could not extrude geometry from {svg_file}")

    mesh = trimesh.util.concatenate(meshes)
    # Vertical flip (top-bottom): reflection across horizontal axis (flip Y).
    bounds = mesh.bounds
    center_y = float((bounds[0][1] + bounds[1][1]) / 2.0)
    mirror_matrix = [
        [1.0, 0.0, 0.0, 0.0],
        [0.0, -1.0, 0.0, 2.0 * center_y],
        [0.0, 0.0, 1.0, 0.0],
        [0.0, 0.0, 0.0, 1.0],
    ]
    mesh.apply_transform(mirror_matrix)

    mesh.export(stl_file)


def iter_svg_files(input_path: Path) -> Iterable[Path]:
    if input_path.is_file():
        if input_path.suffix.lower() != ".svg":
            raise ValueError("Input file must have .svg extension")
        return [input_path]

    return sorted(input_path.glob("*.svg"))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert SVG to STL with vertical mirroring."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("."),
        help="Input SVG file or directory (default: current directory).",
    )
    parser.add_argument(
        "--height",
        type=float,
        default=2.0,
        help="Extrusion height in model units (default: 2.0).",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Output directory for STL files (default: same as input location).",
    )
    args = parser.parse_args()

    svg_files = list(iter_svg_files(args.input))
    if not svg_files:
        print(f"No SVG files found in: {args.input}")
        return

    for svg_file in svg_files:
        out_dir: Path = args.output_dir if args.output_dir else svg_file.parent
        out_dir.mkdir(parents=True, exist_ok=True)
        stl_file = out_dir / f"{svg_file.stem}.stl"
        convert(svg_file, stl_file, args.height)
        print(f"Converted: {svg_file.name} -> {stl_file.name}")


if __name__ == "__main__":
    main()
