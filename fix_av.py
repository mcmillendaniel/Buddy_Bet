c = open('/workspaces/Buddy_Bet/src/App.jsx').read()
for line in c.split('\n'):
    if 'function Av' in line:
        print('FOUND:', repr(line[:120]))
        break
