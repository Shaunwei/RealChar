package ui;

import java.util.ArrayList;

import javax.swing.JProgressBar;
import javax.swing.table.DefaultTableModel;

public class InputTableModel extends DefaultTableModel {

	private static final long serialVersionUID = 1L;
	private String[] COLUMN_NAMES = { "No", "Type", "File", "Progress" };
	private Class<?>[] COLUMN_CLASSES = { Integer.class, String.class,
			String.class, JProgressBar.class };
	private ArrayList<JProgressBar> progresses = new ArrayList<JProgressBar>();

	@Override
	public int getColumnCount() {
		return 4;
	}

	@Override
	public String getColumnName(int column) {
		return COLUMN_NAMES[column];
	}

	@Override
	public Object getValueAt(int row, int column) {
		if (column == 0) {
			return row + 1;
		}
		if (column==3) {
			if (row >= progresses.size()) {
				progresses.add(new JProgressBar());
			}
			JProgressBar bar = progresses.get(row);
			bar.setMinimum(0);
			bar.setMaximum(100);
			return bar;
		}
		return super.getValueAt(row, column);
	}

	@Override
	public Class<?> getColumnClass(int column) {
		return COLUMN_CLASSES[column];
	}

	@Override
	public void fireTableRowsDeleted(int firstRow, int lastRow) {
		for (int row = firstRow; row <= lastRow; row++) {
			progresses.remove(row);
		}
		super.fireTableRowsDeleted(firstRow, lastRow);
	}
	
	@Override
	public boolean isCellEditable(int row, int column) {
		return false;
	}
}
