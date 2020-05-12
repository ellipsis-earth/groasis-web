import React, { PureComponent } from 'react';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

class DataTable extends PureComponent {
/*
  constructor(props, context) {
    super(props, context);

    this.state = {
    };
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
  }
*/
  render() {
    let data = this.props.data;

    if (!this.props.data) {
      return null;
    }

    data.splice(0, 1);
    data.sort((a,b) => a[0].toLowerCase() < b[0].toLowerCase() ? -1 : (a[0].toLowerCase() > b[0].toLowerCase()) ? 1 : 0);

    let cleaned = [];
    data.forEach(x => {
      cleaned.push([x[0].replace('0.00m', '0m'), x[1]]);
    })

    let rows = cleaned.map(x =>
      <TableRow key={x[0] + '_' + x[1]}>
        <TableCell>{x[0]}</TableCell>
        <TableCell>{x[1]}</TableCell>
      </TableRow>
    );

    return (
      <Table size="small">
        <TableHead>
          <TableRow key={'Type_Value'}>
            <TableCell>Type</TableCell>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows}
        </TableBody>
      </Table>
    );
  }
}

export default DataTable;
