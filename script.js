import { sleep } from 'k6';
import http from 'k6/http';

// VU Init (this code is run only once)

export default function () {
  http.get('http://localhost:8080');
  sleep(1);
}