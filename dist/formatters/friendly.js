"use strict";
/**
 * Friendly, human-readable output format
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatFriendlyReviewResult = formatFriendlyReviewResult;
function formatFriendlyReviewResult(result) {
    const parts = [];
    parts.push('## 🔍 ReviewPal\n');
    for (const file of result.files) {
        if (file.hunks.length === 0)
            continue;
        parts.push(`### 📄 \`${file.filename}\`\n`);
        for (const hunk of file.hunks) {
            const lineRange = `${hunk.hunk.startLine}-${hunk.hunk.endLine}`;
            parts.push(`<details>`);
            parts.push(`<summary>Lines ${lineRange}</summary>\n`);
            // AI Review
            if (hunk.aiReview) {
                const { summary, issues, language } = hunk.aiReview;
                parts.push(`**Language:** ${language}\n`);
                parts.push(`**Summary:** ${summary}\n`);
                if (issues.length > 0) {
                    parts.push(`\n**Issues Found:**\n`);
                    for (const issue of issues) {
                        const icon = issue.severity === 'high' ? '🔴' :
                            issue.severity === 'medium' ? '🟡' : '🟢';
                        parts.push(`${icon} **${issue.issue}**`);
                        parts.push(`\n💡 *Fix:* ${issue.suggestion}\n`);
                    }
                }
                else {
                    parts.push(`\n✅ No major issues found.\n`);
                }
            }
            parts.push(`</details>\n`);
        }
        parts.push('---\n');
    }
    parts.push(`<sub>Reviewed ${result.totalHunks} changes • ${(result.totalProcessingTime / 1000).toFixed(1)}s • [ReviewPal](https://github.com/Arephan/reviewpal)</sub>`);
    return parts.join('\n');
}
//# sourceMappingURL=friendly.js.map