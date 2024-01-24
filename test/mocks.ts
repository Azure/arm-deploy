jest.mock('@actions/core', () => coreMock);
import { Options } from "../src/main";

export const coreMock = {
  setFailed: jest.fn(),
  setOutput: jest.fn(),
  getBooleanInput: jest.fn(),
  getInput: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

export function mockInputs(options: Options) {
  coreMock.getInput.mockImplementation(name => {
    const option = options[name as keyof Options];
    if (option === undefined) {
      throw new Error(`Unexpected input: ${name}`);
    }

    return option;
  });
  coreMock.getBooleanInput.mockImplementation(name => {
    const option = options[name as keyof Options];
    if (option === undefined) {
      throw new Error(`Unexpected input: ${name}`);
    }

    return option;
  });
}