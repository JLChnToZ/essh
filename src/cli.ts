import { createRepl } from '.';
import { createReadStream } from 'fs';

if(process.argv.length > 2) {
  createRepl({
    input: createReadStream(process.argv[2], 'utf8'),
  })
} else {
  createRepl();
}