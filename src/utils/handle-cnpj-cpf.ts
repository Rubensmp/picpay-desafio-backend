export function handleCPF(input: string): string {
  return input.replace(/[\/\.\-\D]/g, '');
}
