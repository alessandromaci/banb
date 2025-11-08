# BANB Documentation

**BANB** (Blockchain Agent Neo-Bank) - decentralized mobile banking application combining neo-bank functionality with blockchain infrastructure and AI-powered automation.

## Table of Contents

- [About BANB](#about-banb)
- [Getting Started](#getting-started)
- [Documentation Structure](#documentation-structure)
- [Core Documentation](#core-documentation)
  - [Project Guidelines](#project-guidelines)
  - [MVP Documentation](#mvp-documentation)
  - [User Guides](#user-guides)
- [How to Use This Documentation](#how-to-use-this-documentation)
- [Contributing](#contributing)

## About BANB

BANB is a Next.js 15-based crypto banking application that provides:

- **Digital Banking**: Profile management linked to blockchain wallets
- **Crypto Payments**: USDC transactions on Base and Solana networks
- **DeFi Integration**: Investment accounts with Morpho vaults, lending with Kamino
- **AI Agent**: Natural language banking operations and transaction automation
- **Multi-Chain**: Base (primary) and Solana support with cross-chain bridging
- **Mobile-First**: Designed as a Farcaster MiniApp with responsive UI

**Tech Stack**: Next.js 15, React 19, TypeScript, Wagmi v2, Privy, Supabase, OpenAI/MCP

## Getting Started

### For New Developers

1. **Start here**: Read [product overview](./steering/product.md) to understand what BANB does
2. **Tech stack**: Review [tech.md](./steering/tech.md) to see all technologies used
3. **Architecture**: Study [architecture.md](./mvp/architecture.md) for system design
4. **Data model**: Understand [data-model.md](./mvp/data-model.md) for database schema
5. **Development workflow**: Follow [structure.md](./steering/structure.md) for Git conventions

### For Feature Development

1. Check [requirements.md](./mvp/requirements.md) for MVP scope
2. Read [design.md](./mvp/design.md) for design patterns
3. Review [clarifications.md](./mvp/clarifications.md) for important decisions
4. Follow [structure.md](./steering/structure.md) for coding conventions

### For AI Integration

1. Read [ai-chat-user-guide.md](./ai-chat-user-guide.md) for AI chat features
2. Review [mcp-setup.md](./mcp-setup.md) for Model Context Protocol integration

## Documentation Structure

```
docs/
├── readme.md                      # This file
├── ai-chat-user-guide.md          # AI chat functionality guide
├── mcp-setup.md                   # MCP integration setup
├── steering/                      # Project guidelines
│   ├── product.md                 # Product overview
│   ├── tech.md                    # Tech stack
│   └── structure.md               # Project structure & Git workflow
└── mvp/                           # MVP documentation
    ├── architecture.md            # System architecture
    ├── data-model.md              # Database schema
    ├── requirements.md            # MVP requirements
    ├── design.md                  # Design patterns
    ├── clarifications.md          # Important decisions
    ├── critical-questions.md      # Open questions
    └── project-summary-ru.md      # Project summary (Russian)
```

## Core Documentation

### Project Guidelines

**Location**: `./steering/`

These documents define how the BANB project is organized and developed:

- **[product.md](./steering/product.md)** - Product vision, core features, and architecture philosophy
- **[tech.md](./steering/tech.md)** - Complete tech stack: frameworks, libraries, commands, configuration
- **[structure.md](./steering/structure.md)** - Directory organization, naming conventions, Git workflow, best practices

**When to read**: Start here to understand the project's foundation and development workflow.

### MVP Documentation

**Location**: `./mvp/`

Detailed technical documentation for the Minimum Viable Product:

#### Architecture & Design

- **[architecture.md](./mvp/architecture.md)** - System architecture overview
  - Next.js monolithic architecture
  - Profile-centric data model
  - Multi-chain integration (Base + Solana)
  - Smart wallet strategy (Privy embedded wallets)
  - Component architecture and patterns

- **[data-model.md](./mvp/data-model.md)** - Database schema and relationships
  - Supabase PostgreSQL schema
  - Profile-centric design (1 profile → many accounts/investments)
  - Table definitions with foreign keys
  - Index strategies for performance

- **[design.md](./mvp/design.md)** - Design patterns and technical decisions
  - UI/UX patterns
  - State management approach
  - API design
  - Error handling strategies

#### Requirements & Planning

- **[requirements.md](./mvp/requirements.md)** - MVP requirements and user stories
  - Core features and acceptance criteria
  - User flows (authentication, payments, investments)
  - Success metrics

- **[clarifications.md](./mvp/clarifications.md)** - Important clarifications and decisions
  - Architectural Decision Records (ADRs)
  - Resolved questions
  - Implementation choices

- **[critical-questions.md](./mvp/critical-questions.md)** - Open questions and blockers
  - Unresolved technical questions
  - Decisions pending
  - Risks and mitigation strategies

#### Localization

- **[project-summary-ru.md](./mvp/project-summary-ru.md)** - Project summary in Russian
  - Краткое описание проекта
  - Основные возможности
  - Техническая архитектура

**When to read**: Reference these when implementing features or making architectural decisions.

### User Guides

**Location**: `./` (root of docs)

Guides for using BANB features:

- **[ai-chat-user-guide.md](./ai-chat-user-guide.md)** - How to use AI chat features
  - Natural language banking operations
  - Supported commands
  - AI capabilities and limitations

- **[mcp-setup.md](./mcp-setup.md)** - Model Context Protocol setup guide
  - MCP architecture overview
  - Tool definitions
  - Integration with OpenAI
  - Configuration and deployment

**When to read**: When working on AI features or setting up MCP integration.

## How to Use This Documentation

### By Role

**New Developer**:
1. `steering/product.md` → `steering/tech.md` → `mvp/architecture.md` → `mvp/data-model.md`

**Frontend Developer**:
1. `steering/structure.md` → `mvp/architecture.md` → `mvp/design.md`
2. Focus on: Component patterns, state management, UI/UX

**Backend Developer**:
1. `steering/tech.md` → `mvp/data-model.md` → `mvp/architecture.md`
2. Focus on: Database schema, API design, data flows

**Blockchain Developer**:
1. `steering/product.md` → `mvp/architecture.md` → `mvp/requirements.md`
2. Focus on: Multi-chain integration, smart wallet, DeFi protocols

**AI/MCP Developer**:
1. `ai-chat-user-guide.md` → `mcp-setup.md` → `mvp/architecture.md`
2. Focus on: MCP tools, OpenAI integration, automation

### By Task

**Setting up development environment**:
- `steering/tech.md` (tech stack and commands)
- `steering/structure.md` (directory structure)

**Implementing a new feature**:
- `mvp/requirements.md` (check if feature is in MVP scope)
- `mvp/architecture.md` (understand where it fits)
- `mvp/design.md` (follow design patterns)
- `steering/structure.md` (follow Git workflow)

**Understanding database schema**:
- `mvp/data-model.md` (complete schema)
- `mvp/architecture.md` (profile-centric design philosophy)

**Debugging an issue**:
- `mvp/clarifications.md` (check if issue relates to a known decision)
- `mvp/critical-questions.md` (see if it's a known blocker)
- `mvp/architecture.md` (understand system boundaries)

**Working with AI features**:
- `ai-chat-user-guide.md` (understand AI capabilities)
- `mcp-setup.md` (setup and configuration)

## Contributing

### Updating Documentation

When making changes to the codebase, update relevant documentation:

1. **Code changes** → Update `mvp/architecture.md` or `mvp/design.md`
2. **Database schema changes** → Update `mvp/data-model.md`
3. **New feature** → Update `mvp/requirements.md`
4. **Tech stack changes** → Update `steering/tech.md`
5. **Process changes** → Update `steering/structure.md`

### Documentation Standards

- **File naming**: Use lowercase with hyphens: `data-model.md`, `ai-chat-user-guide.md`
- **Formatting**: Use markdown consistently, include code examples
- **Structure**: Start with overview, use clear headings, maintain table of contents
- **Accuracy**: Keep technical details accurate and up-to-date
- **Clarity**: Write for developers who are new to the project

### Adding New Documentation

1. Determine the appropriate directory:
   - **Project guidelines** → `steering/`
   - **MVP technical docs** → `mvp/`
   - **User guides** → root of `docs/`

2. Create file with lowercase-hyphen naming
3. Add entry to this README's table of contents
4. Link from relevant existing docs

---

**Repository**: [BANB GitHub](https://github.com/yourusername/banb) *(update with actual repo)*
**Last Updated**: 2025-01-08
**Maintained By**: BANB Development Team
