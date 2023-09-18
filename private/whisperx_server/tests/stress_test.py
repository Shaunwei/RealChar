# Creates multiple clients to test the server's performance
# Clients requests are set at a fixed level and are uniformly distributed over time

import os
import numpy as np
from mytest import test
from multiprocessing import Process, Manager
from time import perf_counter, sleep


NUM_PROC = os.cpu_count() or 1  # number of clients
DURATION = 60  # seconds
FREQUENCY = 8  # total requests per second


num_repeat = (DURATION * FREQUENCY - 1) // NUM_PROC + 1
interval = DURATION / num_repeat


def worker(id: int, return_dict: dict):
    latency = []
    start = perf_counter()
    for i in range(num_repeat):
        elapsed = test(verbose=False)
        print(f"worker {id} turn {i + 1} / {num_repeat}: {elapsed * 1000:.0f} ms")
        latency.append(elapsed)
        sleep(max(interval - elapsed, 0))
    end = perf_counter()
    return_dict["latency"] += latency
    return_dict["elapsed"] += end - start


if __name__ == "__main__":
    # warm up
    test(verbose=False)

    processes = []
    with Manager() as manager:
        return_dict = manager.dict()
        return_dict["latency"] = []
        return_dict["elapsed"] = 0
        for i in range(NUM_PROC):
            p = Process(target=worker, args=(i, return_dict))
            p.start()
            processes.append(p)
            sleep(interval / NUM_PROC)
        for i in range(NUM_PROC):
            p = processes[i]
            p.join()
        latency = return_dict["latency"]
        elapsed = return_dict["elapsed"] / NUM_PROC
        mean = np.mean(latency) * 1000
        std = np.std(latency) * 1000
        print(
            f"{len(latency)} Tasks in {elapsed:.0f} seconds, Target Freq: {FREQUENCY:.1f}"
            f", Actual Freq: {len(latency)/elapsed:.1f}, Latency: {mean:.0f} ms ± {std:.0f} ms"
        )
