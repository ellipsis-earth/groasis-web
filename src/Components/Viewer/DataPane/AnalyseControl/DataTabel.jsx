import React, { PureComponent } from 'react';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

class DataTable extends PureComponent {
  render() {
    let data = this.props.data;

    if (!this.props.data) {
      return null;
    }

    let headers = data[0];

    data.splice(0, 1);
    data.sort((a,b) => a[0].toLowerCase() < b[0].toLowerCase() ? -1 : (a[0].toLowerCase() > b[0].toLowerCase()) ? 1 : 0);

    let cleaned = [];
    data.forEach(x => {
      let dataRow = [...x];
      dataRow[0] = dataRow[0].replace('0.00m', '0m');
      cleaned.push(dataRow);
    })

    let rows = [];

    cleaned.forEach((x, i) => {
      let cells = [];
      x.forEach((y, j) => {cells.push(<TableCell key={'soilDataCell_' + x[0] + '_' + headers[j]}>{y}</TableCell>)})
      rows.push(<TableRow key={x.join('_').replace(' ', '-')}>{cells}</TableRow>)
    });


    return (
      <Table size="small">
        <TableHead>
          <TableRow key={'Type_Value'}>
            {headers.map(x => <TableCell key={'soilDataHeader_' + x}>{x}</TableCell>)}
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
