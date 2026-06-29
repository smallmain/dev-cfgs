# Specification-Driven Development

## 简介

本文制定了一种规范驱动开发的流程。

"规范" 是对预期行为的描述。

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
