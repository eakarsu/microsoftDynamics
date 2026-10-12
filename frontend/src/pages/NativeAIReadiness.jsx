import React from 'react';
import NativeRuntimeAI from '../components/NativeRuntimeAI';
import {nativeAdvice} from '../api';
const request=nativeAdvice;
export const config={
  "title": "Sales pipeline readiness",
  "description": "Native OpenRouter advisory review of supplied information. Examples are illustrative; existing records, evidence, approvals, permissions and operational controls remain authoritative. This response performs no external action.",
  "endpoint": "/api/runtime-ai/sales-readiness",
  "fields": [
    {
      "key": "prompt",
      "label": "Review brief",
      "required": true,
      "maxLength": 4000,
      "examples": [
        "Illustrative Sales pipeline readiness brief: review supplied source information, identify evidence gaps, and suggest three next steps for an authorized reviewer. No external action is authorized.",
        "Illustrative Sales pipeline readiness team review: compare options, dependencies, responsible reviewers, and timing. Explain missing evidence and approvals before any operational change.",
        "Illustrative Sales pipeline readiness detailed review: distinguish verified facts from assumptions, compare tradeoffs, and suggest measurable follow-up actions. Do not invent records, integrations, approvals, clinical findings or financial execution."
      ]
    },
    {
      "key": "context",
      "label": "Known facts and constraints",
      "required": false,
      "maxLength": 3000,
      "examples": [
        "Illustrative context: a small sales team has several unqualified leads. No lead records or customer approvals are supplied; identify the data needed before prioritizing outreach.",
        "Illustrative context: the team reviews lead ownership weekly and requires manager approval before conversion. Compare workload, evidence gaps, and handoff steps without assuming any actual records.",
        "Illustrative context: assess qualification criteria, conversion readiness, auditability, and risks over a 30-day review period. Treat volumes and outcomes as unknown until verified in the tenant's records."
      ]
    }
  ]
};
export default function NativeAIReadiness(){return <NativeRuntimeAI config={config} request={request}/>;}
