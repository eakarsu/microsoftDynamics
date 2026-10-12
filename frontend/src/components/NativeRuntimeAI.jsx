import React, {useEffect, useState} from 'react';
import NativeAIControls from './NativeAIControls';
import NativeAIReport from './NativeAIReport';
import useNativeAIRequest from './useNativeAIRequest';
import {nativeAdviceHistory} from '../api';
import './NativeRuntimeAI.css';

export const presetValues = (config, index) => Object.fromEntries(config.fields.map(field => [field.key, field.examples[index]]));
export const buildPrompt = (fields) => fields.context?.trim()
  ? `${fields.prompt || ''}\n\nKnown facts and constraints:\n${fields.context.trim()}`
  : fields.prompt || '';

export function SavedReports({history,historyError,selectedSaved,onSelect}) {
  return <section className="native-runtime-history" aria-label="Saved AI reports"><h2>Saved reports</h2>{historyError&&<p role="alert">Saved reports could not be loaded: {historyError}</p>}{!historyError&&!history.length&&<p>No saved reports yet.</p>}{history.length>0&&<ul>{history.map(item=><li key={item.id}><button type="button" onClick={()=>onSelect(item)}>{new Date(item.created_at).toLocaleString()} · {item.model}</button></li>)}</ul>}{selectedSaved&&<div className="native-runtime-saved"><button type="button" onClick={()=>onSelect(null)}>Close saved report</button><NativeAIReport response={selectedSaved} title="Saved sales readiness report"/></div>}</section>;
}

export default function NativeRuntimeAI({config,request}) {
  const [fields,setFields]=useState({}),[result,setResult]=useState(null),[error,setError]=useState('');
  const [history,setHistory]=useState([]),[selectedSaved,setSelectedSaved]=useState(null),[historyError,setHistoryError]=useState('');
  const native=useNativeAIRequest();
  useEffect(()=>{let active=true;nativeAdviceHistory(config.endpoint).then(({data})=>{if(active)setHistory(data);}).catch(failure=>{if(active)setHistoryError(failure.message);});return()=>{active=false;};},[config.endpoint]);
  const presets=[0,1,2].map(index=>({name:['Quick brief','Team planning','Detailed review'][index],fill:()=>{setFields(presetValues(config,index));return {filled:config.fields.length,manual:[]};}}));
  async function generate(event){event.preventDefault();setError('');setResult(null);try{const response=await native.run(signal=>request(config.endpoint,{prompt:buildPrompt(fields)},{signal}));setResult(response);setHistory(current=>[{...response,created_at:new Date().toISOString()},...current].slice(0,20));}catch(failure){setError(failure.name==='AbortError'?'Request canceled.':failure.response?.data?.error||failure.message);}}
  return <section className="native-runtime-ai" id="ai-readiness"><header><p className="ai-eyebrow">Native AI workspace</p><h1>{config.title}</h1><p>{config.description}</p></header><NativeAIControls busy={native.busy} onCancel={native.cancel} presets={presets} context={config.title}><form onSubmit={generate}><div className="native-runtime-fields">{config.fields.map(field=><label key={field.key} htmlFor={'native-runtime-'+field.key}>{field.label}{field.required?' *':' (optional)'}<textarea id={'native-runtime-'+field.key} data-ai-field={field.key} rows={5} required={field.required} maxLength={field.maxLength||4000} value={fields[field.key]||''} onChange={event=>setFields({...fields,[field.key]:event.target.value})}/></label>)}</div><button type="submit" className="native-runtime-generate" disabled={native.busy}>{native.busy?'Generating…':'Generate with OpenRouter'}</button>{error&&<p role="alert">{error}</p>}</form></NativeAIControls>{result&&<NativeAIReport response={result} title={config.title}/>}<SavedReports history={history} historyError={historyError} selectedSaved={selectedSaved} onSelect={setSelectedSaved}/></section>;
}
