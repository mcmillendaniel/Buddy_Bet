import{useState,useEffect}from 'react'
import{supabase}from './supabase'
import'./App.css'
const PIN='1234'
const G='#1a5c38',GOLD='#c9a84c',SAND='#f5efe0',DS='#ede4cc',W='#fff',RED='#b91c1c',TX='#1a1a1a',MU='#6b5d3f'
const fmt=n=>(n>=0?'+$':'-$')+Math.abs(n).toFixed(2).replace(/\.00$/,'')
const fmtA=n=>'$'+Math.abs(n).toFixed(2).replace(/\.00$/,'')
const ini=n=>n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
function Av({name,color,size=44}){return <div style={{width:size,height:size,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',color:W,fontWeight:600,fontSize:size/2.5,flexShrink:0}}>{ini(name)}</div>}
function Hdr({title,sub,onBack}){return <div style={{background:G,color:W,padding:'16px 20px',display:'flex',alignItems:'center',gap:8,position:'sticky',top:0,zIndex:100}}>{onBack&&<button style={{background:'none',border:'none',color:W,fontSize:28,cursor:'pointer',padding:'0 8px 0 0',lineHeight:1}} onClick={onBack}>&#8249;</button>}<div><div style={{fontSize:20,fontWeight:900,letterSpacing:'0.1em',fontFamily:"'Cinzel',serif",textTransform:'uppercase',lineHeight:1}}>{title}</div>{sub&&<div style={{fontSize:11,opacity:.8,marginTop:1}}>{sub}</div>}</div></div>}
function LoginScreen({onLogin}){
  const [name,setName]=useState('')
  const [pin,setPin]=useState('')
  const [err,setErr]=useState('')
  const [loading,setLoading]=useState(false)
  async function handleLogin(){
    const n=name.trim()
    if(!n||pin.length!==4){setErr('Enter your name and the 4-digit PIN');return}
    if(pin!==PIN){setErr('Wrong PIN — ask the group for it');return}
    setLoading(true);setErr('')
    const{data:existing}=await supabase.from('players').select('*').ilike('name',n).single()
    if(existing){onLogin(existing)}
    else{
      const{data:created,error}=await supabase.from('players').insert([{name:n}]).select().single()
      if(error){setErr('Something went wrong, try again');setLoading(false);return}
      onLogin(created)
    }
  }
  return(
    <div style={{background:SAND,minHeight:'100vh',maxWidth:430,margin:'0 auto',display:'flex',flexDirection:'column'}}>
      <div style={{background:G,padding:'32px 24px 24px',textAlign:'center'}}>
        
        <div style={{color:W,fontSize:42,fontWeight:900,letterSpacing:'0.12em',fontFamily:"'Cinzel',serif",textTransform:'uppercase',lineHeight:1,textShadow:'0 2px 8px rgba(0,0,0,0.18)',marginTop:8}}>Buddy Bet</div>
        <div style={{color:'rgba(255,255,255,0.75)',fontSize:13,letterSpacing:'0.18em',textTransform:'uppercase',marginTop:10,fontFamily:"'Cinzel',serif"}}>Masters Weekend</div>
      </div>
      <div style={{padding:'32px 24px',flex:1}}>
        <div style={{marginBottom:20}}>
          <label style={{display:'block',fontSize:13,fontWeight:500,color:MU,marginBottom:8}}>Your first name</label>
          <input style={{width:'100%',padding:'13px 14px',border:'1.5px solid '+DS,borderRadius:12,fontSize:16,outline:'none',background:W,boxSizing:'border-box'}}
            type='text' value={name}
            onChange={e=>{setName(e.target.value);setErr('')}}
            onKeyDown={e=>e.key==='Enter'&&handleLogin()}
          />
        </div>
        <div style={{marginBottom:24}}>
          <label style={{display:'block',fontSize:13,fontWeight:500,color:MU,marginBottom:8}}>Group PIN</label>
          <input style={{width:'100%',padding:'13px 14px',border:'1.5px solid '+DS,borderRadius:12,fontSize:22,outline:'none',background:W,boxSizing:'border-box',letterSpacing:8,textAlign:'center'}}
            type='password' inputMode='numeric' maxLength={4} placeholder='••••' value={pin}
            onChange={e=>{setPin(e.target.value.replace(/\D/g,'').slice(0,4));setErr('')}}
            onKeyDown={e=>e.key==='Enter'&&handleLogin()}
          />
        </div>
        {err&&<div style={{background:'#fdecea',border:'1px solid #fca5a5',borderRadius:10,padding:'10px 14px',fontSize:13,color:RED,marginBottom:16}}>{err}</div>}
        <button style={{width:'100%',padding:14,borderRadius:12,fontSize:16,fontWeight:600,background:G,color:W,border:'none',cursor:'pointer',opacity:loading?.7:1}}
          onClick={handleLogin} disabled={loading}>
          {loading?'Loading...':'Enter the Club'}
        </button>
        <p style={{textAlign:'center',fontSize:12,color:MU,marginTop:16}}>New here? Just enter your name and the PIN to join.</p>
      </div>
    </div>
  )
}
export default function App(){
  const [tab,setTab]=useState('home')
  const [players,setPlayers]=useState([])
  const [bets,setBets]=useState([])
  const [me,setMe]=useState(null)
  const [loading,setLoading]=useState(true)
  const [ledgerWith,setLedgerWith]=useState(null)
  const [viewProfile,setViewProfile]=useState(null)
  useEffect(()=>{checkSaved()},[])
  async function checkSaved(){
    const saved=localStorage.getItem('buddy_bet_me')
    if(saved){
      const{data}=await supabase.from('players').select('*').eq('id',saved).single()
      if(data){setMe(data);await loadData();setLoading(false);return}
    }
    setLoading(false)
  }
  async function loadData(){
    const{data:pl}=await supabase.from('players').select('*').order('name')
    const{data:bt}=await supabase.from('bets').select('*').order('created_at',{ascending:false})
    setPlayers(pl||[]);setBets(bt||[])
  }
  async function handleLogin(player){
    setMe(player);localStorage.setItem('buddy_bet_me',player.id)
    await loadData();setLoading(false)
  }
  function betsWith(id){if(!me)return[];return bets.filter(b=>(b.challenger_id===me.id&&b.opponent_id===id)||(b.challenger_id===id&&b.opponent_id===me.id))}
  function balWith(id){let n=0;for(const b of betsWith(id)){if(b.status==='open')continue;n+=b.winner_id===me.id?b.amount:-b.amount}return n}
  function unsettled(id){let n=0;for(const b of betsWith(id)){if(b.status==='settle_later')n+=b.winner_id===me.id?b.amount:-b.amount}return n}
  function partners(){if(!me)return[];const ids=new Set();bets.forEach(b=>{if(b.challenger_id===me.id)ids.add(b.opponent_id);if(b.opponent_id===me.id)ids.add(b.challenger_id)});return players.filter(p=>ids.has(p.id))}
  if(loading)return <div style={{background:SAND,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{textAlign:'center'}}><div style={{fontSize:48}}></div><p style={{color:MU}}>Loading...</p></div></div>
  if(!me)return <LoginScreen onLogin={handleLogin}/>
  if(ledgerWith)return <Ledger me={me} other={ledgerWith} bets={betsWith(ledgerWith.id)} bal={balWith(ledgerWith.id)} uns={unsettled(ledgerWith.id)} onBack={()=>setLedgerWith(null)} onSettle={async(id,wid,st)=>{await supabase.from('bets').update({winner_id:wid,status:st}).eq('id',id);await loadData()}} onProfile={()=>setViewProfile(ledgerWith)}/>
  if(viewProfile)return <PView player={viewProfile} onBack={()=>setViewProfile(null)}/>
  const allOthers=players.filter(p=>p.id!==me.id)
  const pts=partners()
  return <div style={{background:SAND,minHeight:'100vh',maxWidth:430,margin:'0 auto',paddingBottom:80}}>
    <Hdr title="Buddy Bet" sub={<>Playing as {me.name} &middot; <span style={{cursor:'pointer',textDecoration:'underline'}} onClick={()=>{localStorage.removeItem('buddy_bet_me');setMe(null);setPlayers([]);setBets([])}}>logout</span></>}/>
    <div style={{padding:16}}>
      {tab==='home'&&<Home me={me} pts={pts} others={allOthers} balWith={balWith} uns={unsettled} onOpen={p=>setLedgerWith(p)}/>}
      {tab==='add'&&<AddBet me={me} players={players} onSave={async b=>{await supabase.from('bets').insert([b]);await loadData();setTab('home')}}/>}
      {tab==='profile'&&<MyProfile me={me} onSave={async u=>{await supabase.from('players').update(u).eq('id',me.id);setMe({...me,...u});await loadData()}}/>}
    </div>
    <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:430,background:W,borderTop:'1px solid '+DS,display:'flex',zIndex:200}}>
      {[['home','&#127968;','Home'],['add','&#10133;','Add Bet'],['profile','&#128100;','Profile']].map(([id,ic,lb])=><button key={id} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:'10px 0 12px',background:'none',border:'none',cursor:'pointer',gap:3,color:tab===id?G:MU,fontSize:11}} onClick={()=>setTab(id)}><span style={{fontSize:20}} dangerouslySetInnerHTML={{__html:ic}}/><span style={{fontSize:11,fontWeight:500}}>{lb}</span></button>)}
    </div>
  </div>
}
function Home({me,pts,others,balWith,uns,onOpen}){
  return <div><div style={{fontSize:11,fontWeight:600,color:G,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:10}}>Your Bets</div>
  {pts.length===0&&<p style={{color:MU,fontSize:14}}>No bets yet — tap Add Bet to get started.</p>}
  {pts.map(p=>{const bal=balWith(p.id),u=uns(p.id);return <div key={p.id} style={{background:W,borderRadius:14,padding:14,marginBottom:10,border:'1px solid '+DS,display:'flex',alignItems:'center',gap:12,cursor:'pointer'}} onClick={()=>onOpen(p)}><Av name={p.name} color={G}/><div style={{flex:1}}><div style={{fontWeight:500,fontSize:16}}>{p.name}</div>{u!==0&&<div style={{fontSize:12,color:MU,marginTop:2}}>Unsettled: <span style={{color:u>0?G:RED,fontWeight:600}}>{fmt(u)}</span></div>}</div><div style={{fontWeight:700,fontSize:17,color:bal>=0?G:RED}}>{fmt(bal)}</div></div>})}
  
  </div>
}
function Ledger({me,other,bets,bal,uns,onBack,onSettle,onProfile}){
  const [exp,setExp]=useState(null)
  const [settling,setSettling]=useState(null)
  const [wid,setWid]=useState(null)
  const open=bets.filter(b=>b.status==='open')
  const closed=bets.filter(b=>b.status!=='open')
  const SL={fontSize:11,fontWeight:600,color:G,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:10,marginTop:8}
  return <div style={{background:SAND,minHeight:'100vh',maxWidth:430,margin:'0 auto',paddingBottom:40}}>
    <Hdr title="Ledger" onBack={onBack}/>
    <div style={{padding:16}}>
      <div style={{background:W,borderRadius:14,padding:16,marginBottom:20,border:'1px solid '+DS}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{textAlign:'center'}}><Av name={me.name} color={G}/><div style={{fontSize:12,color:MU,marginTop:4}}>{me.name}</div></div>
          <div style={{textAlign:'center',flex:1}}><div style={{fontSize:30,fontWeight:700,color:bal>=0?G:RED}}>{fmt(bal)}</div>{uns!==0&&<div style={{fontSize:11,color:MU}}>Unsettled: {fmt(uns)}</div>}</div>
          <div style={{textAlign:'center',cursor:'pointer'}} onClick={onProfile}><Av name={other.name} color={GOLD}/><div style={{fontSize:12,color:MU,marginTop:4}}>{other.name}</div><div style={{fontSize:10,color:GOLD}}>payment info</div></div>
        </div>
      </div>
      {open.length>0&&<><div style={SL}>Open Bets</div>{open.map(b=>{const iC=b.challenger_id===me.id;return <div key={b.id} style={{background:W,borderRadius:12,padding:14,marginBottom:10,border:'1px solid '+DS}}>
        <div style={{display:'flex',justifyContent:'space-between',cursor:'pointer'}} onClick={()=>setExp(exp===b.id?null:b.id)}>
          <div style={{flex:1}}><div style={{fontWeight:500,fontSize:14}}>{b.description}</div><div style={{fontSize:12,color:MU,marginTop:2}}>{iC?'You challenged':'They challenged'} &middot; {fmtA(b.amount)}</div></div>
          <span style={{fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:600,background:'#fef9c3',color:'#854d0e',whiteSpace:'nowrap',alignSelf:'flex-start'}}>Open</span>
        </div>
        {settling===b.id?<div style={{marginTop:12}}>
          <div style={{fontSize:13,color:MU,marginBottom:6,fontWeight:500}}>Who won?</div>
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            <button style={{flex:1,padding:9,borderRadius:9,border:'none',fontWeight:500,cursor:'pointer',background:wid===me.id?G:'#eee',color:wid===me.id?W:TX}} onClick={()=>setWid(me.id)}>{me.name}</button>
            <button style={{flex:1,padding:9,borderRadius:9,border:'none',fontWeight:500,cursor:'pointer',background:wid===other.id?G:'#eee',color:wid===other.id?W:TX}} onClick={()=>setWid(other.id)}>{other.name}</button>
          </div>
          {wid&&<><div style={{fontSize:13,color:MU,marginBottom:6,fontWeight:500}}>Cash exchanged?</div>
          <div style={{display:'flex',gap:8}}>
            <button style={{flex:1,padding:9,borderRadius:9,border:'none',cursor:'pointer',background:'#dcfce7',color:'#166534',fontWeight:500}} onClick={async()=>{await onSettle(b.id,wid,'settled');setSettling(null);setWid(null)}}>&#10003; Settled</button>
            <button style={{flex:1,padding:9,borderRadius:9,border:'none',cursor:'pointer',background:'#fef3c7',color:'#92400e',fontWeight:500}} onClick={async()=>{await onSettle(b.id,wid,'settle_later');setSettling(null);setWid(null)}}>Settle Later</button>
          </div></>}
          <button style={{marginTop:8,background:'none',border:'none',color:MU,fontSize:13,cursor:'pointer'}} onClick={()=>{setSettling(null);setWid(null)}}>Cancel</button>
        </div>:<button style={{width:'100%',marginTop:10,padding:9,borderRadius:9,fontSize:13,fontWeight:500,background:SAND,border:'1.5px solid '+G,color:G,cursor:'pointer'}} onClick={()=>setSettling(b.id)}>Settle this bet</button>}
      </div>})}</>}
      {closed.length>0&&<><div style={SL}>History</div>{closed.map(b=>{const iW=b.winner_id===me.id;return <div key={b.id} style={{background:W,borderRadius:12,padding:14,marginBottom:10,border:'1px solid '+DS}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}} onClick={()=>setExp(exp===b.id?null:b.id)}>
          <div style={{flex:1}}><div style={{fontWeight:500,fontSize:14}}>{b.description}</div><div style={{fontSize:12,color:MU,marginTop:2}}>{iW?'You won':'They won'}</div></div>
          <div style={{textAlign:'right'}}><div style={{fontWeight:700,fontSize:15,color:iW?G:RED}}>{iW?'+':'-'}{fmtA(b.amount)}</div><span style={{fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:600,...(b.status==='settled'?{background:'#dcfce7',color:'#166534'}:{background:'#fef3c7',color:'#92400e'})}}>{b.status==='settled'?'Settled':'Settle Later'}</span></div>
        </div>
        {exp===b.id&&<div style={{marginTop:8,fontSize:13,color:MU,borderTop:'1px solid '+DS,paddingTop:8}}>{b.description}</div>}
      </div>})}</>}
    </div>
  </div>
}
function AddBet({me,players,onSave}){
  const [opp,setOpp]=useState('')
  const [amt,setAmt]=useState('')
  const [desc,setDesc]=useState('')
  const [saving,setSaving]=useState(false)
  const others=players.filter(p=>p.id!==me.id)
  const ok=opp&&amt&&desc
  return <div><div style={{fontSize:11,fontWeight:600,color:G,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:10}}>New Bet</div>
  <div style={{background:W,borderRadius:14,padding:16,border:'1px solid '+DS}}>
    <label style={{display:'block',fontSize:13,color:MU,marginBottom:5}}>Opponent</label>
    <div style={{position:'relative'}}>
          <input
            style={{width:'100%',padding:'11px 12px',border:'1.5px solid '+DS,borderRadius:10,fontSize:15,background:'#fdfaf4',outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}
            type='text'
            placeholder='Search player...'
            value={opp}
            onChange={e=>{setOpp(e.target.value);setOppId('')}}
            autoComplete='off'
          />
          {opp.length>0&&!oppId&&(<div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fdfaf4',border:'1.5px solid '+DS,borderRadius:10,zIndex:50,maxHeight:180,overflowY:'auto',marginTop:4}}>
            {others.filter(p=>p.name.toLowerCase().includes(opp.toLowerCase())).map(p=>(
              <div key={p.id} onClick={()=>{setOpp(p.name);setOppId(p.id)}} style={{padding:'10px 14px',cursor:'pointer',fontSize:15,borderBottom:'1px solid #e8dfc8'}}>{p.name}</div>
            ))}
            {others.filter(p=>p.name.toLowerCase().includes(opp.toLowerCase())).length===0&&<div style={{padding:'10px 14px',color:'#999',fontSize:14}}>No players found</div>}
          </div>)}
        </div>
    <label style={{display:'block',fontSize:13,color:MU,marginBottom:5,marginTop:12}}>Amount ($)</label>
    <input style={{width:'100%',padding:'11px 12px',border:'1.5px solid '+DS,borderRadius:10,fontSize:15,outline:'none',fontFamily:'inherit',boxSizing:'border-box',background:'#fdfaf4'}} type='number' min='0' step='0.5' placeholder='e.g. 5' value={amt} onChange={e=>setAmt(e.target.value)}/>
    <label style={{display:'block',fontSize:13,color:MU,marginBottom:5,marginTop:12}}>What&apos;s the bet?</label>
    <input style={{width:'100%',padding:'11px 12px',border:'1.5px solid '+DS,borderRadius:10,fontSize:15,outline:'none',fontFamily:'inherit',boxSizing:'border-box',background:'#fdfaf4'}} type='text' placeholder='e.g. Scheffler hits the next green' value={desc} onChange={e=>setDesc(e.target.value)}/>
    <button style={{width:'100%',marginTop:18,padding:13,borderRadius:12,fontSize:15,fontWeight:600,background:G,color:W,border:'none',cursor:'pointer',opacity:(!ok||saving)?.5:1}} onClick={async()=>{if(!ok)return;setSaving(true);await onSave({challenger_id:me.id,opponent_id:oppId,amount:parseFloat(amt),description:desc,status:'open',winner_id:null});setOpp('');setAmt('');setDesc('');setSaving(false)}} disabled={!ok||saving||!oppId}>
      {saving?'Saving...':' Lock It In'}
    </button>
  </div></div>
}
function MyProfile({me,onSave}){
  const [v,setV]=useState(me.venmo||'')
  const [c,setC]=useState(me.cashapp||'')
  const [pp,setPp]=useState(me.paypal||'')
  const [ph,setPh]=useState(me.phone||'')
  const [saving,setSaving]=useState(false)
  const [saved,setSaved]=useState(false)
  return <div>
    <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}><Av name={me.name} color={G} size={56}/><div style={{fontSize:20,fontWeight:600}}>{me.name}</div></div>
    <div style={{fontSize:11,fontWeight:600,color:G,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:10}}>Payment Info</div>
    <div style={{background:W,borderRadius:14,padding:16,border:'1px solid '+DS}}>
      {[['Venmo',v,setV,'@username'],['Cash App',c,setC,'$cashtag'],['PayPal',pp,setPp,'email or @username'],['Phone / Zelle',ph,setPh,'10-digit number']].map(([lb,val,set,ph2])=><div key={lb}><label style={{display:'block',fontSize:13,color:MU,marginBottom:5,marginTop:12}}>{lb}</label><input style={{width:'100%',padding:'11px 12px',border:'1.5px solid '+DS,borderRadius:10,fontSize:15,outline:'none',fontFamily:'inherit',boxSizing:'border-box',background:'#fdfaf4'}} type='text' placeholder={ph2} value={val} onChange={e=>set(e.target.value)}/></div>)}
      <button style={{width:'100%',marginTop:18,padding:13,borderRadius:12,fontSize:15,fontWeight:600,background:G,color:W,border:'none',cursor:'pointer'}} onClick={async()=>{setSaving(true);await onSave({venmo:v,cashapp:c,paypal:pp,phone:ph});setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2000)}} disabled={saving}>{saved?'✓ Saved!':saving?'Saving...':'Save Profile'}</button>
    </div>
  </div>
}
function PView({player,onBack}){
  const fields=[['Venmo',player.venmo],['Cash App',player.cashapp],['PayPal',player.paypal],['Phone / Zelle',player.phone]].filter(([,v])=>v)
  return <div style={{background:SAND,minHeight:'100vh',maxWidth:430,margin:'0 auto'}}>
    <Hdr title={player.name} onBack={onBack}/>
    <div style={{padding:16}}>
      <div style={{display:'flex',justifyContent:'center',marginBottom:24}}><Av name={player.name} color={GOLD} size={72}/></div>
      {fields.length===0&&<p style={{color:MU,textAlign:'center',marginTop:40}}>No payment info added yet.</p>}
      {fields.map(([lb,val])=><div key={lb} style={{background:W,borderRadius:12,padding:14,marginBottom:10,border:'1px solid '+DS}}><div style={{fontSize:12,color:MU,marginBottom:4}}>{lb}</div><div style={{fontSize:17,fontWeight:600,color:G}}>{val}</div></div>)}
    </div>
  </div>
}
