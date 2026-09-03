# GitHub Unsplit PR Title

When you open a pull request and you DARED to write more than 70 characters in the single first line, GitHub is so fucking helpful and splits your PR title between the title and the fucking description, and also "helpfully" appends and prepends `…` respectively,

| Title                                                                    | Description                                    |
|--------------------------------------------------------------------------|------------------------------------------------|
| `NOTICKET \`DispoProcessor.importAlternativeImages\` should have a diffe…` | `…rent datadog metric name than \`importImages\`` |


There obviously are requests to github to stop this idiotic rule, but they don't give a fuck:
- [truncating first line of commit message too agressive · community · Discussion #12450 · GitHub](https://github.com/orgs/community/discussions/12450)
- [Extending the length of a PR title from a commit message · community · Discussion #48785 · GitHub](https://github.com/orgs/community/discussions/48785)

Unfortunately, Refined Github is also of opinion that a short title is correct.
- [Add \`limit-commit-title-length\` feature by notlmn · Pull Request #2115 · refined-github/refined-github · GitHub](https://github.com/refined-github/refined-github/pull/2115#discussion_r289895223)
  
As if they know better than me what's fucking right and wrong.

LLVM had to add docs warning contributors about this: [\[docs\] Advise contributors to check for truncated PR titles by asb · Pull Request #68021 · llvm/llvm-project · GitHub](https://github.com/llvm/llvm-project/pull/68021)

This userscript undoes github's retardness.

Inspired by [this gist by lionel-rowe](https://gist.github.com/lionel-rowe/472d3de7738494746e5015d31220b748).
