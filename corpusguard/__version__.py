"""Single source of truth for the CorpusGuard version.

setup.py, the API /health endpoint, the CLI banner, and the PDF report all
read from here. Keep this the ONLY place the version string is defined.
"""
__version__ = "0.1.0"
