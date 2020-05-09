import http from 'k6/http';
import { sleep } from 'k6';

import { exec } from 'child_process';

// VU Init (this code is run only once)
// const exec = require('child_process').exec, child;
const myShellScript = exec('sh doSomething.sh /myDir');

export default function () {
  http.get('http://localhost:8080');
  // sleep(1);
}