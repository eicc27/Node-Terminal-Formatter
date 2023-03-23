import { exit } from "process";
import chalk from "../node_modules/chalk/source/index.js";
import { LSP, Suggestion } from "./lsp/lsp.js";

class MyLSP extends LSP {
    private keywords = ["help", "exit", "update"];

    private snippets = [];

    private matchToken(token: string): Suggestion[] {
        const suggestions: { type: string; value: string; score: number }[] =
            [];
        const match = (keyword: string, type: string) => {
            const matchResult = keyword.matchAll(eval(`/[${token}]/g`));
            // calculate match scores
            let score = 0;
            for (const result of matchResult) {
                if (result.index) score += keyword.length - result.index;
            }
            if (score)
                suggestions.push({
                    value: keyword,
                    type: type,
                    score: score,
                });
        };
        for (const keyword of this.keywords) {
            match(keyword, "k");
        }
        for (const snippet of this.snippets) {
            match(snippet, "[]");
        }
        // sort by score desc
        suggestions.sort((a, b) => {
            return b.score - a.score;
        });
        return suggestions.map((value) => {
            return {
                type: value.type,
                value: value.value,
            };
        });
    }

    protected override suggest(): Suggestion[] {
        const tokens = this.line.split(" ");
        const lastToken = tokens.slice(-1)[0];
        return this.matchToken(lastToken);
    }

    protected override insertSuggestion(): void {
        const tokens = this.line.slice(this.prompt.length).split(" ");
        const suggestion = this.suggestions[this.index].value;
        const suggestionTokens = suggestion.split(" ");
        const newTokens = tokens.slice(0, -suggestionTokens.length);
        newTokens.push(suggestion);
        this.line = this.prompt + newTokens.join(" ");
        const lastToken = tokens.slice(-1)[0];
        if (lastToken.length) process.stdout.write(`\x1b[${lastToken.length}D`);
        process.stdout.write("\x1b[K");
        process.stdout.write(suggestion);
        process.stdout.write("\x1b[s");
    }
}

const sleep = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(null);
        }, ms);
    });
};

const lsp = new MyLSP();
await lsp.listen(async (command: string) => {
    if (command == "help") {
        console.log("This is the help message...");
    }
    if (command == "update") {
        console.log(chalk.blueBright("updating..."));
        await sleep(2000);
        console.log(chalk.greenBright("update complete!"));
    }
    if (command == "exit") {
        console.log(chalk.redBright("goodbye!"));
        exit(0);
    }
});
