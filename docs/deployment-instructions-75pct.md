# 75% Rollout Deployment Instructions

## 🎯 Stage 4: Large majority testing

**Target**: 75% of users get V2 implementation  
**Duration**: 1-2 days  
**Monitoring**: Continuous A/B comparison

### 1. Deploy Configuration
```bash
# Copy the rollout configuration to production
cp deployment-configs/.env.production-75pct .env.production

# Apply to your deployment system
# (Replace with your specific deployment commands)
# Examples:
# - kubectl apply -f k8s-config.yaml
# - docker-compose up -d
# - pm2 reload app
# - Your CI/CD pipeline trigger
```

### 2. Verify Deployment
```bash
# Check that environment variables are applied
# Verify 75% rollout is active
# Confirm A/B comparison logging is working
```

### 3. Monitor Migration Health
```bash
# Run monitoring script regularly (every 1-2 hours)
node scripts/monitor-migration.js

# Check application logs for:
# - A/B comparison data
# - Any JavaScript errors
# - Performance metrics
# - User behavior patterns
```

### 4. Success Criteria
- [ ] No increase in scroll-related user reports
- [ ] A/B comparison logs show consistent behavior
- [ ] Application performance stable or improved
- [ ] Error rates remain within normal range
- [ ] Smooth user experience across browsers/devices

### 5. If Issues Arise
```bash
# Immediate rollback to V1
node scripts/emergency-rollback.js "75% rollout issues detected"

# This will:
# - Revert all users to V1 implementation
# - Stop A/B comparison
# - Log the rollback reason
```

### 6. After 1-2 days
If all success criteria are met:
- Proceed to next rollout stage (100%)
- Document any findings
- Continue monitoring

---
**Stage Duration**: 1-2 days  
**Next Stage**: 100%  
**Emergency Contact**: [Your team contact info]
