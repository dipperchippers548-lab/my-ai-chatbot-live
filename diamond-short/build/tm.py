import json,sys
c=json.load(open('build/cuts.json'))
def tm(t): return (t-sum(min(t,b)-a for a,b in c['cuts'] if t>a))/c['speed']
print(' '.join(f'{tm(float(x)):.2f}' for x in sys.argv[1:]))
