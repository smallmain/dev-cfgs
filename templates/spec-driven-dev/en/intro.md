# Specification-Driven Development

## Introduction

This document defines a specification-driven development process.

A "specification" describes the expected behavior.

```
spec/
├── requirement/                        # Source of truth (your system's behavior)
└── changes/                            # Proposed updates (one folder per change)
    └── <change-name>/
        ├── proposal.md
        └── requirements/               # Delta specs (what's changing)
            └── <domain>/
                └── requirements.md
```
