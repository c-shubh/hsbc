import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from 'src/hooks/useAuth';
import {
  fetchCategoryBreakdown,
  fetchCustomerSegmentation,
  fetchMerchantPerformance,
  fetchOverview,
} from 'src/utils/api';
import AppConversionRates from '../app-conversion-rates';
import AppCurrentVisits from '../app-current-visits';
import AppWebsiteVisits from '../app-website-visits';
import AppWidgetSummary from '../app-widget-summary';

// ----------------------------------------------------------------------

export default function AppView() {
  const { isLoggedIn, account } = useAuth();
  const [overview, setOverview] = useState(null);
  const [customerSegmentation, setCustomerSegmentation] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState(null);
  const [merchantFraudRate, setMerchantFraudRate] = useState(null);
  const [merchantPerformance, setMerchantPerformance] = useState(null);

  useEffect(() => {
    const asyncFn = async () => {
      if (!isLoggedIn) return;
      setOverview(await fetchOverview(account.token));
      setCustomerSegmentation(await fetchCustomerSegmentation(account.token));
      setCategoryBreakdown(await fetchCategoryBreakdown(account.token));
      const merchantPerformance = await fetchMerchantPerformance(account.token);
      setMerchantPerformance(merchantPerformance);
      const mfr = [];
      if (merchantPerformance !== null) {
        merchantPerformance.forEach((m) => {
          if (m.fraudRate !== 0) {
            mfr.push({ label: m.merchant, value: m.fraudRate });
          }
        });
      }
      mfr.sort((a, b) => {
        return b.value - a.value;
      });
      setMerchantFraudRate(mfr);
    };

    asyncFn();
  }, []);

  if (!isLoggedIn) {
    return <Link to="/login">Please login</Link>;
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 5 }}>
        Hi, Welcome back 👋
      </Typography>

      <Grid container spacing={3}>
        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Total transactions"
            total={overview ? overview.totalTransactions : 0}
            color="success"
            icon={<img alt="icon" src="/assets/icons/glass/ic_glass_bag.png" />}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Customers"
            total={overview ? overview.totalUniqueCustomers : 0}
            color="info"
            icon={<img alt="icon" src="/assets/icons/glass/ic_glass_users.png" />}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Categories"
            total={overview ? overview.transactionsByCategory.length : 0}
            color="warning"
            icon={<img alt="icon" src="/assets/icons/glass/ic_glass_buy.png" />}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Fraud rate %"
            total={
              overview
                ? (overview.totalFraudulentTransactions / overview.totalTransactions) * 100
                : 0
            }
            color="error"
            icon={<img alt="icon" src="/assets/icons/glass/ic_glass_message.png" />}
          />
        </Grid>

        <Grid xs={12} md={6} lg={8}>
          <AppWebsiteVisits
            title="Category breakdown (avg amount)"
            chart={{
              labels: categoryBreakdown ? categoryBreakdown.map((c) => c.category) : [],

              series: [
                {
                  name: 'Average amount',
                  type: 'column',
                  fill: 'solid',
                  data: categoryBreakdown
                    ? categoryBreakdown.map((c) => parseFloat(c.averageAmount.toFixed(2)))
                    : [],
                },
              ],
            }}
          />
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          <AppCurrentVisits
            title="Gender (customer count)"
            chart={{
              series: customerSegmentation
                ? customerSegmentation.genderSegmentation.map((gs) => ({
                    label: gs.gender,
                    value: gs.customerCount,
                  }))
                : [],
            }}
          />
        </Grid>

        <Grid xs={12} md={12} lg={12}>
          <AppConversionRates
            title="Merchant fraud rate"
            chart={{
              series: merchantFraudRate ? merchantFraudRate : [],
            }}
          />
        </Grid>

        {/* <Grid xs={12} md={6} lg={4}>
          <AppCurrentSubject
            title="Merchant performance"
            chart={{
              categories: ['English', 'History', 'Physics', 'Geography', 'Chinese', 'Math'],
              series: [
                { name: 'Series 1', data: [80, 50, 30, 40, 100, 20] },
                { name: 'Series 2', data: [20, 30, 40, 80, 20, 80] },
                { name: 'Series 3', data: [44, 76, 78, 13, 43, 10] },
              ],
            }}
          />
        </Grid> */}
      </Grid>
    </Container>
  );
}
