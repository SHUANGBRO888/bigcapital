import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Route, Switch, useHistory } from 'react-router-dom';
import { useQuery, queryCache } from 'react-query';
import { Alert, Intent } from '@blueprintjs/core';

import AppToaster from 'components/AppToaster';
import { FormattedMessage as T, useIntl } from 'react-intl';
import DashboardPageContent from 'components/Dashboard/DashboardPageContent';
import DashboardInsider from 'components/Dashboard/DashboardInsider';

import BillsDataTable from './BillsDataTable';
import BillActionsBar from './BillActionsBar';
import BillViewTabs from './BillViewTabs';

import withDashboardActions from 'containers/Dashboard/withDashboardActions';
import withResourceActions from 'containers/Resources/withResourcesActions';

import withBills from './withBills';
import withBillActions from './withBillActions';
import withViewsActions from 'containers/Views/withViewsActions';

import { compose } from 'utils';

function BillList({
  // #withDashboardActions
  changePageTitle,

  // #withViewsActions
  requestFetchResourceViews,
  requestFetchResourceFields,

  //#withBills
  billsTableQuery,

  //#withBillActions
  requestFetchBillsTable,
  requestDeleteBill,
  addBillsTableQueries,
}) {
  const history = useHistory();
  const { formatMessage } = useIntl();
  const [deleteBill, setDeleteBill] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    changePageTitle(formatMessage({ id: 'bill_list' }));
  }, [changePageTitle, formatMessage]);

  const fetchResourceViews = useQuery(
    ['resource-views', 'bills'],
    (key, resourceName) => requestFetchResourceViews(resourceName),
  );

  const fetchResourceFields = useQuery(
    ['resource-fields', 'bills'],
    (key, resourceName) => requestFetchResourceFields(resourceName),
  );

  const fetchBills = useQuery(['bills-table', billsTableQuery], () =>
    requestFetchBillsTable(),
  );

  //handle dalete Bill
  const handleDeleteBill = useCallback(
    (bill) => {
      setDeleteBill(bill);
    },
    [setDeleteBill],
  );

  // handle cancel Bill
  const handleCancelBillDelete = useCallback(() => {
    setDeleteBill(false);
  }, [setDeleteBill]);

  // handleConfirm delete invoice
  const handleConfirmBillDelete = useCallback(() => {
    requestDeleteBill(deleteBill.id).then(() => {
      AppToaster.show({
        message: formatMessage({
          id: 'the_bill_has_been_successfully_deleted',
        }),
        intent: Intent.SUCCESS,
      });
      setDeleteBill(false);
    });
  }, [deleteBill, requestDeleteBill, formatMessage]);

  const handleEditBill = useCallback((bill) => {
    history.push(`/bills/${bill.id}/edit`);
  });

  const handleFetchData = useCallback(
    ({ pageIndex, pageSize, sortBy }) => {
      const page = pageIndex + 1;

      addBillsTableQueries({
        ...(sortBy.length > 0
          ? {
              column_sort_by: sortBy[0].id,
              sort_order: sortBy[0].desc ? 'desc' : 'asc',
            }
          : {}),
        page_size: pageSize,
        page,
      });
    },
    [addBillsTableQueries],
  );

  // Handle selected rows change.
  const handleSelectedRowsChange = useCallback(
    (_invoices) => {
      setSelectedRows(_invoices);
    },
    [setSelectedRows],
  );

  // Handle filter change to re-fetch data-table.
  const handleFilterChanged = useCallback(
    (filterConditions) => {
      addBillsTableQueries({
        filter_roles: filterConditions || '',
      });
    },
    [fetchBills],
  );

  return (
    <DashboardInsider
      loading={fetchResourceViews.isFetching || fetchResourceFields.isFetching}
      name={'bills'}
    >
      <BillActionsBar
        // onBulkDelete={}
        selectedRows={selectedRows}
        onFilterChanged={handleFilterChanged}
      />
      <DashboardPageContent>
        <Switch>
          <Route exact={true}>
            <BillViewTabs />
            <BillsDataTable
              loading={fetchBills.isFetching}
              onDeleteBill={handleDeleteBill}
              onFetchData={handleFetchData}
              onEditBill={handleEditBill}
              onSelectedRowsChange={handleSelectedRowsChange}
            />
          </Route>
        </Switch>
        <Alert
          cancelButtonText={<T id={'cancel'} />}
          confirmButtonText={<T id={'delete'} />}
          icon={'trash'}
          intent={Intent.DANGER}
          isOpen={deleteBill}
          onCancel={handleCancelBillDelete}
          onConfirm={handleConfirmBillDelete}
        >
          <p>
            <T id={'once_delete_this_bill_you_will_able_to_restore_it'} />
          </p>
        </Alert>
      </DashboardPageContent>
    </DashboardInsider>
  );
}

export default compose(
  withResourceActions,
  withBillActions,
  withDashboardActions,
  withViewsActions,
  withBills(({ billsTableQuery }) => ({
    billsTableQuery,
  })),
)(BillList);