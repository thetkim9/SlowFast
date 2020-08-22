#testing the funcionality of 'yield' command
import time
def one():
    for i in range(10):
        time.sleep(1)
        yield i

def two():
    for j in range(3):
        for i in one():
            yield i

for j in two():
    print(j)