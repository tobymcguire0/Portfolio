---
title: FernBot
description: A local-first coding agent TUI built with pydantic-ai, Textual, and Ollama.
stack: [Python, pydantic-ai, Textual, Ollama, LLM]
github: https://github.com/tobymcguire0/FernBot
featured: true
order: 1
role: Solo developer
---

FernBot (AKA "Fern") is a homemade coding assistant named after one of my cats that runs entirely on a local LLM served through Ollama with no cloud API keys required. Built on pydantic-ai for structured tool use and Textual for a streamed chat-style TUI, Fern reads, edits, and runs code in the working directory using a coding-agent toolset: file read/write, targeted single and multi-edit, glob, grep, shell execution, Python REPL, web search/fetch, and a todo planner.

The project was an exercise in building a real agent loop for 0 cost coding help: designing the tool surface, wiring permission prompts for destructive operations, and managing streamed output from a local model. It also doubles as a daily-driver assistant for my own development work without needing to worry about token counts and costs for large industry models.
