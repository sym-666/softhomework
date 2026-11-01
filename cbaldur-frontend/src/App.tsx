import { Router, Route } from 'wouter';
import { Provider, useDispatch } from 'react-redux';
import { useEffect, Suspense, lazy } from 'react';
import { useGetInitialQuery } from './redux/api/case';
import { useGetSupercomputersQuery } from './redux/api/user';
import { setSchemasFromYaml } from './redux/slices/inputsSlice';
import { store } from './redux/store';
import { I18nProvider } from './i18n/I18nProvider';
import { RibbonLayout } from './components/office/RibbonLayout';
import { AuthGuard } from './components/auth/auth-guard';
import { SignIn } from './routes/auth/sign-in';
import { SignUp } from './routes/auth/sign-up';
import { ForgotPassword } from './routes/auth/forgot-password';
import { GithubCallback } from './routes/auth/github-callback';
import { Toaster } from '@/shadcn/components/ui/sonner';
import Home from './routes';
import Cases from './routes/cases';
const Case = lazy(() => import('./routes/cases/Case'));
import AddCasesIndex from './routes/add-cases';
import AddCasesBase from './routes/add-cases/base';
import AddCasesJson from './routes/add-cases/json';
import AddCasesNamelist from './routes/add-cases/namelist';
import AddCasesSummary from './routes/add-cases/summary';
import AddCasesImpurity from './routes/add-cases/impurity';
import AddCasesTransport from './routes/add-cases/transport';
import AddCasesTransportModel from './routes/add-cases/transport-model';
import AddCasesInitialization from './routes/add-cases/initialization';
import AddCasesBoundary from './routes/add-cases/boundary';
import AddCasesGasPuffing from './routes/add-cases/gas-puffing-and-pellet-inject';
import AddCasesNBIHeating from './routes/add-cases/nbi-heating';
import AddCasesReread from './routes/add-cases/reread';
import AddCasesBaldurControl from './routes/add-cases/baldur-control';
import AddCasesComment from './routes/add-cases/comment';
import AddCasesDynamic from './routes/add-cases/dynamic';
import AddCasesIndexDynamic from './routes/add-cases/index-dynamic';
import UserProfile from './routes/user';
import PapersPage from './routes/papers';

const MainApp = () => {
  const dispatch = useDispatch();
  const { data: initialData, isSuccess } = useGetInitialQuery();
  const { data: supercomputers } = useGetSupercomputersQuery();

  useEffect(() => {
    if (isSuccess && initialData) {
      dispatch(setSchemasFromYaml(initialData));
    }
  }, [isSuccess, initialData, dispatch]);

  // Log supercomputers for debugging (can be removed in production)
  useEffect(() => {
    if (supercomputers) {
      console.log('Available supercomputers:', supercomputers);
    }
  }, [supercomputers]);

  return (
    <Router>
      <AuthGuard>
        <Route path="/auth/sign-in" component={SignIn} />
        <Route path="/auth/sign-up" component={SignUp} />
        <Route path="/auth/forgot-password" component={ForgotPassword} />
        <Route path="/auth/github/callback" component={GithubCallback} />

        <RibbonLayout>
          <Route path="/" component={Home} />
          <Route path="/cases" component={Cases} />
          <Route path="/cases/:userId/:caseId">
            {(params) => (
              <Suspense fallback={<div>Loading...</div>}>
                <Case {...params} />
              </Suspense>
            )}
          </Route>
          <Route path="/add-cases" component={AddCasesIndex} />
          <Route path="/add-cases/base" component={AddCasesBase} />
          <Route path="/add-cases/impurity" component={AddCasesImpurity} />
          <Route path="/add-cases/transport" component={AddCasesTransport} />
          <Route path="/add-cases/transport-model" component={AddCasesTransportModel} />
          <Route path="/add-cases/initialization" component={AddCasesInitialization} />
          <Route path="/add-cases/boundary" component={AddCasesBoundary} />
          <Route path="/add-cases/gas-puffing-and-pellet-inject" component={AddCasesGasPuffing} />
          <Route path="/add-cases/nbi-heating" component={AddCasesNBIHeating} />
          <Route path="/add-cases/reread" component={AddCasesReread} />
          <Route path="/add-cases/baldur-control" component={AddCasesBaldurControl} />
          <Route path="/add-cases/comment" component={AddCasesComment} />
          <Route path="/add-cases/json/:configName">
            {(params) => <AddCasesJson configName={params.configName} />}
          </Route>
          <Route path="/add-cases/json">
            {() => <AddCasesJson />}
          </Route>
          <Route path="/add-cases/namelist" component={AddCasesNamelist} />
          <Route path="/add-cases/summary" component={AddCasesSummary} />
          <Route path="/add-cases/dynamic-index" component={AddCasesIndexDynamic} />
          <Route path="/add-cases/dynamic/:configName/:panelIndex" component={AddCasesDynamic} />
          <Route path="/add-cases/dynamic" component={AddCasesDynamic} />
          <Route path="/user" component={UserProfile} />
          <Route path="/papers" component={PapersPage} />
        </RibbonLayout>
      </AuthGuard>
      <Toaster />
    </Router>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <I18nProvider>
        <MainApp />
      </I18nProvider>
    </Provider>
  );
};

export default App;
