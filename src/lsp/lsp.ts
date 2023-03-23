import { exit } from "process";
import { emitKeypressEvents, Key } from "readline";
import chalk from "../../node_modules/chalk/source/index.js";
import { Style } from "./style.js";

const MAX_LENGTH = 20;

export type Suggestion = {
    type: string;
    value: string;
};

export class LSP {
    protected line: string = "";
    private isReaderOpen: boolean = true;
    private isSuggestionsShowing: boolean = false;
    protected suggestions: Suggestion[] = [];
    protected index = 0;

    public constructor(
        private readonly _style: Style = new Style(),
        protected prompt: string = ">>"
    ) {
        emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);
        process.stdout.write(this.prompt);
        this.line = this.prompt;
    }

    private async listenKeypressEvents(
        dispatcher: (cmd: string) => void | Promise<void>
    ) {
        process.stdin.on("keypress", async (_: string, key: Key) => {
            if (!this.isReaderOpen) return;
            // console.log(`${key.name}, ${key.sequence}`);
            if (key.name == "return") {
                this.clearSuggestions();
                process.stdout.write("\n");
                this.isReaderOpen = false;
                await dispatcher(this.line.slice(this.prompt.length));
                process.stdout.write(this.prompt);
                this.line = this.prompt;
                this.isReaderOpen = true;
            } else if (key.name == "backspace") {
                if (this.isSuggestionsShowing) {
                    this.clearSuggestions();
                } else if (this.line.length > this.prompt.length) {
                    this.line = this.line.slice(0, -1);
                    process.stdout.write("\b"); // backspace
                    process.stdout.write("\x1b[K"); // clear to line end
                }
            } else if (key.name == "tab") {
                if (this.isSuggestionsShowing) {
                    this.clearSuggestions(true);
                } else {
                    process.stdout.write("\t");
                }
            } else if (
                key.name &&
                ["up", "down", "left", "right"].includes(key.name)
            ) {
                if (!this.isSuggestionsShowing) return;
                if (["down", "right"].includes(key.name)) {
                    this.index++;
                    if (this.index >= this.suggestions.length) this.index = 0;
                } else {
                    this.index--;
                    if (this.index < 0)
                        this.index = this.suggestions.length - 1;
                }
                process.stdout.write("\x1b[u"); // load cursor position
                this.showSuggestions(this.index);
            } else {
                if (!key.sequence) return;
                if (key.ctrl && key.name == "c") exit(0);
                if (this.isSuggestionsShowing) this.clearSuggestions();
                process.stdout.write(key.sequence);
                process.stdout.write("\x1b[s"); // save cursor position
                this.line += key.sequence;
                if (key.sequence.match(/[a-zA-Z]/g)) {
                    this.suggestions = this.suggest();
                    this.showSuggestions();
                }
            }
        });
    }

    private clearSuggestions(insert: boolean = false) {
        process.stdout.write("\x1b[u"); // load cursor position
        process.stdout.write("\x1b[J"); // clear after cursor
        if (insert) this.insertSuggestion();
        this.isSuggestionsShowing = false;
        this.index = 0;
        this.suggestions = [];
    }

    private showSuggestions(index: number = 0) {
        let i = 0;
        for (const suggestion of this.suggestions) {
            const length = suggestion.value.length + suggestion.type.length + 4;
            let candidate = "";
            const lengthDifference = MAX_LENGTH - length;
            if (length < MAX_LENGTH) {
                // dark gray
                candidate = chalk.hex("#63666A")(suggestion.value);
                for (let i = 0; i < lengthDifference; i++) candidate += " ";
            } else {
                candidate = chalk.hex("#63666A")(
                    suggestion.value.slice(0, lengthDifference - 7) + "..."
                );
                for (let i = 0; i < 4; i++) candidate += " ";
            }
            // blue
            candidate += chalk.hex("#90C1D7").italic(suggestion.type);
            // light gray

            if (i == index) candidate = chalk.bgHex("#FF6347")(candidate);
            else candidate = chalk.bgWhiteBright(candidate);
            process.stdout.write(candidate + "\n");
            process.stdout.cursorTo(this.line.length);
            i++;
        }
        if (this.suggestions.length) this.isSuggestionsShowing = true;
    }

    protected suggest(): Suggestion[] {
        throw new EvalError("LSP core function suggest not implemented");
    }

    protected insertSuggestion() {
        throw new EvalError(
            "LSP core function insertSuggestion not implemented"
        );
    }

    public async listen(dispatcher: (cmd: string) => void | Promise<void>) {
        await this.listenKeypressEvents(dispatcher);
    }
}
