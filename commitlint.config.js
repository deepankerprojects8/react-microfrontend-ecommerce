module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',       // New feature
        'fix',        // Bug fix
        'docs',       // Documentation
        'style',      // Code style (formatting, semicolons)
        'refactor',   // Code refactor (no feature change)
        'perf',       // Performance improvement
        'test',       // Add/update tests
        'chore',      // Build process, dependencies
        'ci',         // CI/CD configuration
        'revert',     // Revert previous commit
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [2, 'always', 'lower-case'],
    'body-leading-blank': [2, 'always'],
  },
};
