import re
from pathlib import Path

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as f:
    long_description = f.read()

# Read the single source of truth for the version without importing the package
# (which would require its runtime dependencies to be installed first).
_version_src = Path(__file__).parent.joinpath("corpusguard", "__version__.py").read_text()
version = re.search(r'__version__\s*=\s*"([^"]+)"', _version_src).group(1)

setup(
    name="corpusguard",
    version=version,
    author="Frankline Ondieki Ombachi",
    author_email="ondiekifrank021@gmail.com",
    description="Production-ready RAG security testing and defense framework",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/OndiekiFrank/CorpusGuard",
    packages=find_packages(),
    python_requires=">=3.9",
    install_requires=[
        "faiss-cpu>=1.7.4",
        "sentence-transformers>=2.2.2",
        "openai>=1.0.0",
        "pandas>=1.5.0",
        "numpy>=1.24.0",
        "scikit-learn>=1.2.0",
        "tqdm>=4.65.0",
        "reportlab>=4.0.0",
        "typer>=0.12.0",
        "rich>=13.0.0",
        "cryptography>=42.0.0",
    ],
    extras_require={
        "dev": ["pytest>=7.0", "pytest-cov>=4.0", "httpx>=0.27.0"],
    },
    entry_points={
        "console_scripts": [
            "corpusguard=corpusguard.cli:app",
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Information Technology",
        "Topic :: Security",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    keywords="ai security rag llm adversarial machine learning red team",
)
