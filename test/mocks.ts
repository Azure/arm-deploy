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
    return options[name as keyof Options] ?? '';
  });
  coreMock.getBooleanInput.mockImplementation(name => {
    return options[name as keyof Options] ?? false;
  });
}