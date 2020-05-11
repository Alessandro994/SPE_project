import http from 'k6/http';

// VU Init is run only once per VU.

// VU code which is run over and over for as long as the test is running.
export default function () {
  http.get('http://localhost:8080');
  // sleep(1);
}