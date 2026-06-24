#!/usr/bin/env bash
set -a
source .env.campaign
set +a
node scripts/sendCampaign.mjs --resume >> logs/campaign-run.log 2>&1
