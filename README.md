# Test app for React Email Builder

The only app in this project, used as the playground. It consumes the library's built packages from `../react-email-builder`, through their real export map, so build the library first.

```bash
pnpm dev    # the editor
```

## URL options

| Option | Effect |
|---|---|
| `?scenario=blocks` | Loads a fixture: `blocks`, `rich`, `columns`, `custom`, `empty`, `large`, `clipped`, `malicious` or `corrupt` |
| `?export=1` | Shows the real exported HTML beside the canvas, the email as Outlook and Gmail would show it, or its inbox score |
| `?ai=fake` | Uses a scripted model, which is repeatable and free |
| `?aiDelay=150` | Makes the scripted model slow, for testing Stop |

Without `?ai=fake`, the AI uses the Gemini key in `.env`, which costs money.

## License

[MIT](LICENSE)
