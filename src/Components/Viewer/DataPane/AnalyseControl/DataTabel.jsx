import React, { PureComponent } from 'react';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

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
      <TableRow key={x[0] + '_' + x[1]}>
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
