import http from 'k6/http';
import { check } from 'k6';

// VU Init is run only once per VU.

// VU code which is run over and over for as long as the test is running.
export default function () {
  let res = http.get('http://localhost:8080');

  check(
    res,
    { "is status 200": r => r.status === 200 },
    {
      server_id: res.headers.server_id
    }
  );

  // sleep(1);
}