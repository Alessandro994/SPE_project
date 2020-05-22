import http from 'k6/http';
import {check} from 'k6';
import {Gauge} from 'k6/metrics';

// Custom metric to save the server id as tag
var response_time_gauge = new Gauge('response_time');

export let options = {
    systemTags: ["iter", "proto", "subproto", "status", "method", "url", "name", "group", "check", "error", "error_code", "tls_version"],
    tags: {
        simulation: __ENV.SIMULATION,
        load_balacing: __ENV.LOAD_BALANCING
    }
};

// VU code which is run over and over for as long as the test is running.
export default function () {
    let res = http.get('http://localhost:8080');

    check(
        res,
        {"is status 200": r => r.status === 200},
        {
            server_id: res.headers["X-Server-Id"]
        }
    );

    response_time_gauge.add(
        res.timings.duration,
        {
            server_id: res.headers["X-Server-Id"],
            iteration: __ITER
        }
    )

    // sleep(1);
}