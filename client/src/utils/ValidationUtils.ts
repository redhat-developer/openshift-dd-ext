export function validateLength(value: string, min: number, max: number): string {
  if (value.length < min || value.length > max) {
    return `Length must be between ${min} and ${max} characters`;
  }
  return '';
}

export function validateResourcePattern(value: string, message: string): string {
  return (value && value.match('^[a-z0-9]([-a-z0-9]*[a-z0-9])*$')) ? '' : message;
}