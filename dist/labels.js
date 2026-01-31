"use strict";
/**
 * Label Manager - Handles PR labeling for split tracking
 *
 * Feature 4: Label-Based Priority System
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSizeLabel = getSizeLabel;
exports.addSizeLabel = addSizeLabel;
exports.addSplitLabels = addSplitLabels;
exports.formatSplitClosedComment = formatSplitClosedComment;
exports.ensureLabelsExist = ensureLabelsExist;
// Label prefixes
const SPLIT_FROM_PREFIX = 'split-from:';
const REVIEW_ORDER_PREFIX = 'review-order:';
const SIZE_PREFIX = 'size:';
/**
 * Get size label based on line count
 */
function getSizeLabel(lines) {
    if (lines <= 100)
        return `${SIZE_PREFIX}xs`;
    if (lines <= 250)
        return `${SIZE_PREFIX}s`;
    if (lines <= 500)
        return `${SIZE_PREFIX}m`;
    if (lines <= 800)
        return `${SIZE_PREFIX}l`;
    return `${SIZE_PREFIX}xl`;
}
/**
 * Add size label to a PR
 */
async function addSizeLabel(github, prNumber, lines) {
    const label = getSizeLabel(lines);
    // Remove any existing size labels first
    for (const size of ['xs', 's', 'm', 'l', 'xl']) {
        await github.removeLabel(prNumber, `${SIZE_PREFIX}${size}`);
    }
    await github.addLabels(prNumber, [label]);
}
/**
 * Add split tracking labels
 */
async function addSplitLabels(github, prNumber, originalPrNumber, order, total) {
    const labels = [
        `${SPLIT_FROM_PREFIX}#${originalPrNumber}`,
        `${REVIEW_ORDER_PREFIX}${order}/${total}`,
    ];
    await github.addLabels(prNumber, labels);
}
/**
 * Format the comment for a closed original PR that was split
 */
function formatSplitClosedComment(originalPrNumber, splits) {
    const splitList = splits
        .sort((a, b) => a.order - b.order)
        .map((s) => `- #${s.number} - ${s.title} (review ${s.order === 1 ? 'first' : s.order === splits.length ? 'last' : `#${s.order}`})`)
        .join('\n');
    const reviewOrder = splits
        .sort((a, b) => a.order - b.order)
        .map((s) => `#${s.number}`)
        .join(' → ');
    return `## ⚠️ PR #${originalPrNumber} split into ${splits.length} smaller PRs

${splitList}

**Review order:** ${reviewOrder}

---

<sub>🦞 AI PR Helper | Split for easier review</sub>`;
}
/**
 * Ensure required labels exist in the repo
 */
async function ensureLabelsExist(github, _owner, _repo) {
    // In a full implementation, we'd create labels if they don't exist
    // For now, we rely on GitHub's auto-creation of labels
    // This is a placeholder for that functionality
    const _labelsToCreate = [
        { name: 'size:xs', color: '00ff00', description: 'Extra small PR (≤100 lines)' },
        { name: 'size:s', color: '88ff00', description: 'Small PR (101-250 lines)' },
        { name: 'size:m', color: 'ffff00', description: 'Medium PR (251-500 lines)' },
        { name: 'size:l', color: 'ff8800', description: 'Large PR (501-800 lines)' },
        { name: 'size:xl', color: 'ff0000', description: 'Extra large PR (>800 lines)' },
        { name: 'needs-split', color: 'ff0000', description: 'PR is too large and needs to be split' },
    ];
    // TODO: Implement label creation
    // This would require additional GitHub API calls
}
//# sourceMappingURL=labels.js.map