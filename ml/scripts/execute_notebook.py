"""Execute and preserve notebook outputs using the project kernel."""

import os
from pathlib import Path

import nbformat
from nbclient import NotebookClient

ROOT = Path(__file__).resolve().parents[1]
os.environ["JUPYTER_PATH"] = str(ROOT / ".venv" / "share" / "jupyter")
os.environ["JUPYTER_RUNTIME_DIR"] = str(ROOT / ".jupyter" / "runtime")
os.environ["IPYTHONDIR"] = str(ROOT / ".jupyter" / "ipython")
os.environ["MPLCONFIGDIR"] = str(ROOT / ".matplotlib")
os.environ["PYTHONPATH"] = str(ROOT) + os.pathsep + os.environ.get("PYTHONPATH", "")

path = ROOT / "smishguard_training.ipynb"
notebook = nbformat.read(path, as_version=4)
client = NotebookClient(notebook, timeout=900, kernel_name="smishguard-ml",
                        resources={"metadata": {"path": str(ROOT)}})


def progress(cell_index, **_):
    cell = notebook.cells[cell_index]
    if cell.cell_type == "code":
        print(f"Executing cell {cell_index + 1}/{len(notebook.cells)}: {cell.source.splitlines()[0][:90]}", flush=True)


client.on_cell_start = progress
try:
    client.execute()
finally:
    nbformat.write(notebook, path)
print("Notebook execution complete; outputs saved.")
