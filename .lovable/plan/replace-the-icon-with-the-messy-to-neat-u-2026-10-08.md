# Replace the icon with the "Messy-to-neat U"

Swap the current sheets-and-arrow icon for the mark you picked: a **U** whose left side is a stack of uneven, offset blocks and whose right side is a neat, flush stack — messy CVs becoming one uniform format.

## What happens

1. **Clean up the mark.** The draft has a faint white halo around its edges (it was cut out against white), which would show as a bright fringe in a dark browser tab. I'll refine the same drawing — same shape, same idea — removing the halo and matching the orange to the exact one the site already uses.

2. **Make the blocks survive small sizes.** Checked at 128, 64, 32 and 16 px: the U is clear down to 32 px, but at 16 px the blocks merge into a solid stroke. So the mark gets slightly wider gaps between blocks, and the browser-tab version uses a simplified three-block-per-side cut that stays readable at tab size.

3. **Put it in place.** The refined mark replaces the current icon file, and the browser-tab icon is rebuilt from it. The header and the tab already point at those two files, so no other changes are needed — the new icon appears in the navbar next to "Uniform." and in the browser tab.

4. **Check it.** I'll look at the header at its real size and the tab icon on both light and dark backgrounds before saying it's done, and confirm the page still builds.

## Technical details

- Refine `/tmp/uniform-icons/concept-b.png` with an image edit: keep the U silhouette, the messy-left/neat-right block contrast and the flat fill; remove white matte/fringe, widen the block gaps slightly, target colour `#D75928` (the site's `--accent`).
- Build two outputs: full mark → `src/assets/uniform-icon.png` (replaces the existing file); simplified small-size mark → 64×64 padded square at `public/favicon.png`.
- No code edits: `src/routes/index.tsx` already imports `@/assets/uniform-icon.png` for the navbar, and `src/routes/__root.tsx` already declares `/favicon.png`.
- Verify with a Playwright screenshot of the header and a light/dark render of the tab icon, plus `/tmp/observability/build-errors.log`.
