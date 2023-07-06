package ui;

import java.awt.Component;
import java.awt.Frame;
import java.awt.event.ActionEvent;
import java.beans.PropertyChangeEvent;
import java.beans.PropertyChangeListener;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Locale;

import javax.swing.AbstractAction;
import javax.swing.Action;
import javax.swing.ImageIcon;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JComponent;
import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JOptionPane;
import javax.swing.JProgressBar;
import javax.swing.JRadioButton;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import javax.swing.filechooser.FileFilter;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.TableCellRenderer;

import mp3.Main;

import org.swixml.SwingEngine;

public class LameUI extends JFrame {
	private static final long serialVersionUID = 1L;

	public static class JComponentCellRenderer implements TableCellRenderer {

		public Component getTableCellRendererComponent(JTable table,
				Object value, boolean isSelected, boolean hasFocus, int row,
				int column) {
			return (JComponent) value;
		}

	}

	public static void main(String[] args) {
		new LameUI();
	}

	protected Picture picture;
	protected JButton doRemove, doEncodeDecode;
	protected JTable files;
	protected JComboBox presets, cbr, abr, vbr, algorithm;
	protected JRadioButton setCBR, setABR, setVBR;
	protected JRadioButton setStereo, setJointStereo, setForcedJointStereo,
			setDualChannels, setMono, setAuto;
	protected JRadioButton outputIsInput, customOutputDir;
	protected JTextField outputDir;
	protected JCheckBox overwrite;

	protected int inUse;

	protected File lastDir;
	protected FileFilter musicFilter = new FileFilter() {

		@Override
		public String getDescription() {
			return "MUSIC (WAV, MP3)";
		}

		@Override
		public boolean accept(File f) {
			return f.isDirectory()
					|| (f.getName().toLowerCase().endsWith(".wav") || f
							.getName().toLowerCase().endsWith(".mp3"));
		}
	};

	public Action add = new AbstractAction() {

		private static final long serialVersionUID = 1L;

		public void actionPerformed(ActionEvent e) {
			JFileChooser fileDialog = new JFileChooser(lastDir);
			fileDialog.setMultiSelectionEnabled(true);
			fileDialog.setFileFilter(musicFilter);
			final Frame containerFrame = JOptionPane
					.getFrameForComponent(LameUI.this);
			int rc = fileDialog.showOpenDialog(containerFrame);
			if (rc == JFileChooser.APPROVE_OPTION
					&& fileDialog.getSelectedFile() != null) {
				lastDir = fileDialog.getSelectedFile().getParentFile();
				File[] selectedFiles = fileDialog.getSelectedFiles();
				DefaultTableModel model = (DefaultTableModel) files.getModel();
				for (int i = 0; i < selectedFiles.length; i++) {
					File file = selectedFiles[i];
					String ext = file.getName().substring(
							file.getName().lastIndexOf('.') + 1);
					model.addRow(new Object[] { 0, ext, file.getAbsolutePath() });
				}
			}
		}
	};

	public Action remove = new AbstractAction() {

		private static final long serialVersionUID = 1L;

		public void actionPerformed(ActionEvent e) {
			DefaultTableModel model = (DefaultTableModel) files.getModel();
			while (files.getSelectedRows().length > 0) {
				model.removeRow(files.getSelectedRows()[0]);
			}
		}
	};

	public Action setPresets = new AbstractAction() {

		private static final long serialVersionUID = 1L;

		public void actionPerformed(ActionEvent e) {
			setPresetsOrCustom(true);
		}
	};

	public Action setCustom = new AbstractAction() {

		private static final long serialVersionUID = 1L;

		public void actionPerformed(ActionEvent e) {
			setPresetsOrCustom(false);
		}
	};

	public Action encodeDecode = new AbstractAction() {

		private static final long serialVersionUID = 1L;

		public void actionPerformed(ActionEvent e) {
			DefaultTableModel model = (DefaultTableModel) files.getModel();
			for (int row = 0; row < model.getRowCount(); row++) {
				final String filename = String
						.valueOf(model.getValueAt(row, 2));
				final JProgressBar bar = (JProgressBar) model
						.getValueAt(row, 3);
				if (bar.getValue()==100) {
					continue;
				}
				try {
					final ArrayList<String> cmd = getCommand(filename);
					for (int i = 0; i < cmd.size(); i++) {
						System.out.print(cmd.get(i) + " ");
					}
					System.out.println();
					final Main main = new Main();
					main.getSupport().addPropertyChangeListener(new PropertyChangeListener() {
						
						public void propertyChange(final PropertyChangeEvent evt) {
							if ("progress".equals(evt.getPropertyName())) {
								bar.setValue(Integer.valueOf(evt.getNewValue().toString()));
								SwingUtilities.invokeLater(new Runnable() {
									
									@Override
									public void run() {
										repaint();
									}
								});
							}
						}
					});
					new Thread(new Runnable() {
						
						public void run() {
							synchronized (LameUI.this) {
								inUse++;
								doRemove.setEnabled(false);
								doEncodeDecode.setEnabled(false);
							}
							try {
								System.out.println(cmd);
								main.run(cmd.toArray(new String[cmd.size()]));
							} catch (IOException e) {
								e.printStackTrace();
							} finally {
								synchronized (LameUI.this) {
									inUse--;
									if (inUse == 0) {
										doRemove.setEnabled(true);
										doEncodeDecode.setEnabled(true);
									}
								}
								bar.setValue(100);
							}
						}
					}).start();
				} catch (IOException e1) {
					System.err.println(e1.getMessage());
				}
			}
		}

	};

	public Action chooseOutputDir = new AbstractAction() {

		private static final long serialVersionUID = 1L;

		public void actionPerformed(ActionEvent e) {
			JFileChooser fileDialog = new JFileChooser(lastDir);
			fileDialog.setFileSelectionMode(JFileChooser.DIRECTORIES_ONLY);
			final Frame containerFrame = JOptionPane
					.getFrameForComponent(LameUI.this);
			int rc = fileDialog.showOpenDialog(containerFrame);
			if (rc == JFileChooser.APPROVE_OPTION
					&& fileDialog.getSelectedFile() != null) {
				lastDir = fileDialog.getSelectedFile();
				File file = fileDialog.getSelectedFile();
				outputDir.setText(file.getAbsolutePath());

				customOutputDir.setSelected(true);
			}
		}
	};

	public LameUI() {
		try {
			// use system L&F
			UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());

			SwingEngine swix = new SwingEngine(this);
			swix.getTaglib().registerTag("picture", Picture.class);
			swix.insert(new URL("file:../conf/LameUI.xml"), this);

			presets.addItem("Medium (~160 kbps)");
			presets.addItem("Standard (~192 kbps)");
			presets.addItem("Extreme (~224 kbps)");
			presets.addItem("Insane (320 kbps)");
			presets.setSelectedItem("Standard (~192 kbps)");

			cbr.addItem(320);
			cbr.addItem(256);
			cbr.addItem(224);
			cbr.addItem(192);
			cbr.addItem(160);
			cbr.addItem(128);
			cbr.addItem(112);
			cbr.addItem(96);
			cbr.addItem(80);
			cbr.addItem(64);
			cbr.addItem(56);
			cbr.addItem(48);
			cbr.addItem(40);
			cbr.addItem(32);
			cbr.setSelectedItem(192);

			vbr.addItem("0 - highest");
			vbr.addItem("1");
			vbr.addItem("2 - recommended");
			vbr.addItem("3");
			vbr.addItem("4 - default");
			vbr.addItem("5");
			vbr.addItem("6");
			vbr.addItem("7");
			vbr.addItem("8");
			vbr.addItem("9");
			vbr.setSelectedItem("2 - recommended");

			for (int i = 310; i >= 8; i--) {
				abr.addItem(i);
			}
			abr.setSelectedItem(192);

			algorithm.addItem("0 - highest quality, very slow");
			algorithm.addItem("1");
			algorithm.addItem("2 - recommended");
			algorithm.addItem("3");
			algorithm.addItem("4");
			algorithm.addItem("5 - LAME default");
			algorithm.addItem("6");
			algorithm.addItem("7 - Fast, ok quality");
			algorithm.addItem("8");
			algorithm.addItem("9 - Poor quality, but fast");
			algorithm.addItem("Auto");

			files.getColumnModel().getColumn(0).setMaxWidth(50);
			files.getColumnModel().getColumn(1).setMaxWidth(100);
			files.getColumnModel().getColumn(3).setMaxWidth(100);
			files.setDefaultRenderer(JComponent.class, new JComponentCellRenderer());

			final URL resource =new URL("file:../images/picture.png");
			picture.setComposerImage(new ImageIcon(resource).getImage());

			pack();
			setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
			setVisible(true);
		} catch (Exception e) {
			e.printStackTrace();
		}

	}

	protected void setPresetsOrCustom(boolean isPresets) {
		presets.setEnabled(isPresets);
		setCBR.setEnabled(!isPresets);
		setABR.setEnabled(!isPresets);
		setVBR.setEnabled(!isPresets);
		cbr.setEnabled(!isPresets);
		abr.setEnabled(!isPresets);
		vbr.setEnabled(!isPresets);
	}

	protected ArrayList<String> getCommand(String filename) throws IOException {
		ArrayList<String> cmd = new ArrayList<String>();
		if (new File(filename).getName().toLowerCase(Locale.US)
				.endsWith(".mp3")) {
			cmd.add("--decode");
		}
		if (presets.isEnabled()) {
			// preset
			String pr = String.valueOf(presets.getSelectedItem());
			cmd.add("--preset");
			cmd.add(pr.substring(0, pr.indexOf(' ')).toLowerCase(Locale.US));
		} else {
			// custom
			if (setVBR.isSelected()) {
				// vbr
				String v = String.valueOf(vbr.getSelectedItem());
				if (v.indexOf(' ') != -1) {
					v = v.substring(0, v.indexOf(' '));
				}
				cmd.add("-v");
				cmd.add("-V");
				cmd.add(v);
			} else if (setABR.isSelected()) {
				// abr
				String a = String.valueOf(abr.getSelectedItem());
				cmd.add("--abr");
				cmd.add(a);
			} else {
				// cbr
				String a = String.valueOf(cbr.getSelectedItem());
				cmd.add("--cbr");
				cmd.add("-b");
				cmd.add(a);
			}
		}
		String eaq = String.valueOf(algorithm.getSelectedItem());
		if (!"Auto".equals(eaq)) {
			if (eaq.indexOf(' ') != -1) {
				eaq = eaq.substring(0, eaq.indexOf(' '));
			}
			cmd.add("-q");
			cmd.add(eaq);
		}

		if (setStereo.isSelected()) {
			cmd.add("-m");
			cmd.add("s");
		} else if (setJointStereo.isSelected()) {
			cmd.add("-m");
			cmd.add("j");
		} else if (setForcedJointStereo.isSelected()) {
			cmd.add("-m");
			cmd.add("f");
		} else if (setDualChannels.isSelected()) {
			cmd.add("-m");
			cmd.add("d");
		} else if (setMono.isSelected()) {
			cmd.add("-m");
			cmd.add("m");
		}

		cmd.add(filename);
		if (!outputIsInput.isSelected()) {
			String outDir = outputDir.getText();
			if (outDir.length() == 0) {
				outDir = System.getProperty("user.dir");
			}
			String outName = new File(filename).getName();
			if (outName.toLowerCase(Locale.US).endsWith(".mp3")) {
				outName = outName.substring(0, outName.lastIndexOf('.'))
						+ ".wav";
			} else {
				// outName.toLowerCase(Locale.US).endsWith(".wav")
				outName = outName.substring(0, outName.lastIndexOf('.'))
						+ ".mp3";
			}
			cmd.add(new File(outDir, outName).getAbsolutePath());
			if (!overwrite.isSelected() && new File(outDir, outName).exists()) {
				throw new IOException("Output file "
						+ new File(outDir, outName) + " already exists!");
			}
		} else {
			// Custom output dir
			String outName = new File(filename).getName();
			if (outName.toLowerCase(Locale.US).endsWith(".mp3")) {
				outName = outName.substring(0, outName.lastIndexOf('.'))
						+ ".wav";
			} else {
				// outName.toLowerCase(Locale.US).endsWith(".wav")
				outName = outName.substring(0, outName.lastIndexOf('.'))
						+ ".mp3";
			}
			String outDir = new File(filename).getParent();
			cmd.add(new File(outDir, outName).getAbsolutePath());
			if (!overwrite.isSelected() && new File(outDir, outName).exists()) {
				throw new IOException("Output file "
						+ new File(outDir, outName) + " already exists!");
			}
		}
		return cmd;
	}
}
