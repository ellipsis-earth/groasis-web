import React, { PureComponent } from 'react';

import {
  Table,
  TableCell,
  TableHead,
  TableBody,
  TableRow
} from '@material-ui/core';

class DataTable extends PureComponent {

  constructor(props, context) {
    super(props, context);

    this.state = {
    };
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
  }

  render() {
    let data = this.props.data;

    if (!this.props.data) {
      return null;
    }

    let rows = data.map(x =>
      <TableRow>
        <TableCell>{x[0]}</TableCell>
        <TableCell>{x[1]}</TableCell>
      </TableRow>
    );

    let header = rows[0];
    rows.splice(0, 1);

    return (
      <Table size="small">
        <TableHead>
          {header}
        </TableHead>
        <TableBody>
          {rows}
        </TableBody>
      </Table>
    );
  }
}

export default DataTable;
