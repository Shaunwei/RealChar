package ui;

import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.RenderingHints;

import javax.swing.JComponent;

public final class Picture extends JComponent {

	private static final long serialVersionUID = 1L;

	private Image composerImage;

	/**
	 * @param collection
	 */
	public Picture() {
	}

	{
		setOpaque(true);
		setPreferredSize(new Dimension(200, 200));
	}

	public final void setComposerImage(Image image) {
		composerImage = image;
	}

	@Override
	public void paint(Graphics g) {
		g.setColor(getBackground());
		g.fillRect(0, 0, getWidth(), getHeight());
		if (composerImage != null) {
			int picWidth = composerImage.getWidth(null);
			int picHeight = composerImage.getHeight(null);

			int availableWidth = getWidth();
			int availableHeight = getHeight();

			/* figure out which dimension limits scaling first */
			float scaleW = (float) availableWidth / picWidth;
			float scaleH = (float) availableHeight / picHeight;

			float safeScale = scaleW > scaleH ? scaleH : scaleW;
			picWidth *= safeScale;
			picHeight *= safeScale;

			((Graphics2D) g).setRenderingHint(RenderingHints.KEY_INTERPOLATION,
					RenderingHints.VALUE_INTERPOLATION_BICUBIC);
			g.drawImage(composerImage, (availableWidth - picWidth) / 2,
					(availableHeight - picHeight) / 2, picWidth, picHeight,
					null);
		}
	}

	@Override
	public void update(Graphics g) {
		paint(g);
	}
}