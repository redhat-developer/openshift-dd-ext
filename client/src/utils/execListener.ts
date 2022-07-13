export default interface ExecListener {
    onOutput(line: string): void;
    onError(line: string): void;
}