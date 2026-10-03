/**
 * Comment settings.
 *
 * The blog is a static site, so the comment server is a separate deployment.
 * Leave `serverURL` empty to hide the section entirely; fill it in with the
 * address of your Waline instance (for example https://comments.example.com)
 * and rebuild to turn comments on.
 *
 * Deploying a server is documented in docs/editorial-workflow.md.
 */
export const commentsConfig = {
  /** Waline server address. Empty means no comment box. */
  serverURL: '',
} as const;