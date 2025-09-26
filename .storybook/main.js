/**
 * Storybook main configuration.
 * Uses React (webpack5) builder; focuses only on component stories for visual regression (Chromatic).
 */
module.exports = {
  framework: '@storybook/react-webpack5',
  stories: [
    '../src/stories/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/preset-create-react-app'
  ],
  staticDirs: ['../public'],
  docs: { autodocs: false }
};
