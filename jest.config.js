module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    NODE_ENV: 'test',
    'ts-jest': {
      diagnostics: false
    }
  }
}
