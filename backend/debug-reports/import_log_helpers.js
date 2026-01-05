/* ADDED BY ANTI-GRAVITY */
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.resolve('debug-reports');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

export function createImportLogger(timestamp) {
    const logFile = path.join(LOG_DIR, `import_log_${timestamp}.log`);
    const jsonReportFile = path.join(LOG_DIR, `import_report_${timestamp}.json`);
    const txtReportFile = path.join(LOG_DIR, `import_report_${timestamp}.txt`);

    const log = (msg, type = 'INFO') => {
        const line = `[${new Date().toISOString()}] [${type}] ${msg}\n`;
        fs.appendFileSync(logFile, line);
        if (type === 'ERROR' || type === 'WARN') process.stderr.write(line);
        else process.stdout.write(line);
    };

    const saveReport = (data) => {
        fs.writeFileSync(jsonReportFile, JSON.stringify(data, null, 2));
    };

    const saveTextReport = (text) => {
        fs.writeFileSync(txtReportFile, text);
        console.log(`\n📄 Report saved to: ${txtReportFile}`);
    };

    return { log, saveReport, saveTextReport, logFile };
}
