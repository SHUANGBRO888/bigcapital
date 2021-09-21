import React from 'react';
import { FormGroup, TextArea } from '@blueprintjs/core';
import { FormattedMessage as T } from 'components';
import { FastField } from 'formik';
import classNames from 'classnames';
import { Postbox, Row, Col } from 'components';
import { CLASSES } from 'common/classes';
import Dragzone from 'components/Dragzone';
import { inputIntent } from 'utils';

// Bill form floating actions.
export default function BillFormFooter() {
  return (
    <div class={classNames(CLASSES.PAGE_FORM_FOOTER)}>
      <Postbox title={<T id={'bill_details'} />} defaultOpen={false}>
        <Row>
          <Col md={8}>
            <FastField name={'note'}>
              {({ field, meta: { error, touched } }) => (
                <FormGroup
                  label={<T id={'note'} />}
                  className={'form-group--note'}
                  intent={inputIntent({ error, touched })}
                >
                  <TextArea growVertically={true} {...field} />
                </FormGroup>
              )}
            </FastField>
          </Col>

          <Col md={4}>
            <Dragzone
              initialFiles={[]}
              // onDrop={onDropFiles}
              // onDeleteFile={onDropFiles}
              hint={<T id={'attachments_maximum'} />}
            />
          </Col>
        </Row>
      </Postbox>
    </div>
  );
}