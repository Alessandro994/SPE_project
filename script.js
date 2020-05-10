import http from 'k6/http';

// VU Init (this code is run only once)
// exec('ls');

export default function () {
  http.get('http://localhost:8080');
  // sleep(1);
}